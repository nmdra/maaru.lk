import { getGenerativeModel, Schema } from 'firebase/ai';
import { ai } from './firebaseConfig';

/**
 * Convert a React Native image URI to Base64
 * @param {string} uri
 * @returns {Promise<string>}
 */
async function uriToBase64(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate structured product details from an image using AI
 * OR translate product details to a target language
 * OR extract and expand search keywords from a description
 * @param {string|null} imageUri - Image URI for product analysis (null for translation/search)
 * @param {string|null} requestData - JSON string with translation/search request (null for image analysis)
 * @returns {Promise<Object|null>}
 */
export async function generateProductDetails(imageUri = null, requestData = null) {
  // Handle special AI requests (translation, keyword extraction, swap messages)
  if (requestData && !imageUri) {
    try {
      const request = JSON.parse(requestData);

      // Handle intelligent product analysis and ranking
      if (request.task === 'analyze_product_suitability') {
        const suitabilitySchema = Schema.object({
          properties: {
            matches: Schema.array({
              items: Schema.object({
                properties: {
                  productId: Schema.string(),
                  score: Schema.number(), // 0-100
                  reason: Schema.string(),
                },
              }),
            }),
          },
        });

        // Prepare product data for AI (limit to essential info to save tokens)
        const productsForAI = request.products.map(p => ({
          id: p.productId,
          name: p.name || 'Unknown',
          category: p.category || 'Other',
          price: p.price || 0,
          condition: p.condition || 'Used',
          keywords: p.keywords?.slice(0, 10) || [], // Limit keywords
          tags: p.tags?.slice(0, 5) || [], // Limit tags
        }));

        const prompt = `
          You are an intelligent product matching system. Analyze the user's description and find the MOST suitable products.
          
          User wants: "${request.description}"
          ${request.userProductPrice ? `User's product value: ${request.userProductPrice} LKR` : ''}
          
          Available products (${productsForAI.length} total):
          ${JSON.stringify(productsForAI, null, 2)}
          
          Your task:
          1. Understand what the user REALLY wants based on their description
          2. Consider semantic meaning, not just exact keyword matches
          3. Think about related items (e.g., "computer" could mean laptop, desktop, tablet)
          4. Consider value fairness if user's product price is provided
          5. Rank products by suitability (0-100 score)
          6. Return TOP 15-20 most suitable products
          7. Provide a brief reason for each match
          
          Examples of good reasoning:
          - "Matches 'laptop' keyword and similar value range"
          - "Gaming console matches user's interest in gaming setup"
          - "High-quality phone matches request for mobile device"
          
          Be intelligent and creative in understanding user intent!
        `;

        const model = getGenerativeModel(ai, {
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: suitabilitySchema,
          },
        });

        const result = await model.generateContent([prompt]);
        console.log('Product suitability analysis result:', result.response.text());
        return result.response.text();
      }

      // Handle keyword extraction for swap search (legacy - keeping for backwards compatibility)
      if (request.task === 'extract_swap_keywords') {
        const keywordSchema = Schema.object({
          properties: {
            keywords: Schema.array({
              items: Schema.string(),
            }),
            relatedTerms: Schema.array({
              items: Schema.string(),
            }),
            categories: Schema.array({
              items: Schema.string(),
            }),
          },
        });

        const prompt = `
          Analyze this product search description and extract comprehensive search terms.
          Think about related products, synonyms, and variations.
          
          User's description: "${request.description}"
          ${request.targetProduct ? `Target product context: ${JSON.stringify(request.targetProduct)}` : ''}
          
          Examples:
          - "I want a computer" → keywords: ["computer", "laptop", "desktop", "PC", "workstation", "macbook"]
          - "need running shoes" → keywords: ["running shoes", "sneakers", "athletic shoes", "sports shoes", "trainers"]
          - "gaming setup" → keywords: ["gaming", "computer", "monitor", "keyboard", "mouse", "console", "PlayStation", "Xbox"]
          
          Extract:
          1. Main keywords from the description
          2. Related terms and synonyms
          3. Relevant product categories
          
          Be creative and think of what the user might actually want based on their description.
        `;

        const model = getGenerativeModel(ai, {
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: keywordSchema,
          },
        });

        const result = await model.generateContent([prompt]);
        console.log('Keyword extraction result:', result.response.text());
        return result.response.text();
      }

      // Handle swap message generation
      if (request.task === 'generate_swap_message') {
        const messageSchema = Schema.object({
          properties: {
            message: Schema.string(),
          },
        });

        const prompt = `
          Generate a friendly and professional swap request message.
          
          User is offering: ${request.userProduct.name}
          ${request.userProduct.count > 1 ? `(${request.userProduct.count} items total)` : ''}
          Value: ${request.userProduct.price} ${request.userProduct.currency}
          
          User wants: ${request.targetProduct.name}
          Value: ${request.targetProduct.price} ${request.targetProduct.currency}
          Condition: ${request.targetProduct.condition}
          
          User's note: "${request.userDescription}"
          
          Create a polite swap request message that:
          1. Introduces the swap proposal
          2. Highlights the value exchange
          3. Expresses genuine interest
          4. Asks if they're open to the swap
          
          Keep it conversational and friendly (2-3 sentences max).
        `;

        const model = getGenerativeModel(ai, {
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: messageSchema,
          },
        });

        const result = await model.generateContent([prompt]);
        console.log('Swap message result:', result.response.text());
        return result.response.text();
      }

      // Handle chat reply generation
      if (request.task === 'generate_chat_reply') {
        const replySchema = Schema.object({
          properties: {
            reply: Schema.string(),
            tone: Schema.enumString({
              enum: ['friendly', 'professional', 'casual', 'enthusiastic'],
            }),
            confidence: Schema.number(), // 0-100
          },
        });

        // Format conversation history for AI
        const conversationContext = request.messages
          .slice(-10) // Last 10 messages for context
          .reverse() // Chronological order (oldest to newest)
          .map(msg => {
            const isCurrentUser = msg.senderId === request.currentUserId;
            const sender = isCurrentUser ? 'You' : 'Other person';
            return `${sender}: ${msg.text || '[Image]'}`;
          })
          .join('\n');

        // Get the most recent message (the one to reply to)
        const lastMessage = request.messages[0]; // First in array (newest)
        const isLastMessageFromUser = lastMessage.senderId === request.currentUserId;
        const lastMessageText = lastMessage.text || '[Image]';

        const prompt = `
          You are a helpful AI assistant generating a reply for a marketplace chat conversation.
          The conversation is between two people discussing products, swaps, or transactions.
          
          Full Conversation History (for context):
          ${conversationContext}
          
          MOST RECENT MESSAGE (you MUST reply to this):
          ${isLastMessageFromUser ? 'You' : 'Other person'}: ${lastMessageText}
          
          Context:
          - This is a peer-to-peer marketplace chat
          - Users discuss product details, pricing, conditions, and trades
          - Keep replies natural, friendly, and context-aware
          - If discussing products, be specific about details
          - If negotiating, be fair and reasonable
          - Match the conversation's tone (casual vs professional)
          
          YOUR TASK: Generate a direct reply to the MOST RECENT MESSAGE above.
          
          Guidelines:
          1. DIRECTLY respond to what the other person just said
          2. If they asked a question, answer it (or acknowledge you need info)
          3. If they made a statement, respond appropriately
          4. Keep it conversational and natural
          5. Be concise (1-2 sentences, max 3 if needed)
          6. Use casual marketplace language
          7. Move the conversation forward (ask follow-up questions, show interest, clarify)
          
          Examples of GOOD replies to common messages:
          
          If they said: "Is this still available?"
          → "Yes, it's still available! Would you like to know more about it?"
          
          If they said: "How much are you asking for this?"
          → "I'm asking [check your messages for context], but I'm open to reasonable offers!"
          
          If they said: "Can we meet tomorrow?"
          → "Tomorrow works! What time is convenient for you?"
          
          If they said: "Does it come with the original box?"
          → "Let me check on that and get back to you. Do you need anything else to know?"
          
          If they said: "I'm interested in swapping"
          → "That sounds interesting! What did you have in mind for the swap?"
          
          If they said: "Thanks!"
          → "You're welcome! Let me know if you need anything else."
          
          DO NOT:
          - Ignore what they just said
          - Make up product details not mentioned
          - Commit to prices not discussed
          - Be overly formal or robotic
          - Generate long paragraphs
          - Give generic replies that don't address their message
        `;

        const model = getGenerativeModel(ai, {
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: replySchema,
          },
        });

        const result = await model.generateContent([prompt]);
        console.log('Chat reply result:', result.response.text());
        return result.response.text();
      }

      // Handle product market analysis and price check
      if (request.task === 'analyze_product_market') {
        const analysisSchema = Schema.object({
          properties: {
            marketPrice: Schema.object({
              properties: {
                min: Schema.number(),
                max: Schema.number(),
                average: Schema.number(),
                currency: Schema.string(),
              },
            }),
            priceVerdict: Schema.enumString({
              enum: ['excellent_deal', 'fair_price', 'slightly_high', 'overpriced', 'underpriced'],
            }),
            marketDemand: Schema.enumString({
              enum: ['very_high', 'high', 'moderate', 'low', 'very_low'],
            }),
            condition: Schema.object({
              properties: {
                assessment: Schema.string(),
                affectsPrice: Schema.boolean(),
              },
            }),
            similarProducts: Schema.array({
              items: Schema.object({
                properties: {
                  name: Schema.string(),
                  estimatedPrice: Schema.number(),
                  source: Schema.string(),
                },
              }),
              maxItems: 5,
            }),
            insights: Schema.array({
              items: Schema.string(),
              maxItems: 5,
            }),
            recommendation: Schema.string(),
            trustScore: Schema.number(),
          },
        });

        const { product, targetLanguage } = request;
        const analysisLanguage = targetLanguage || 'English';

        const prompt = `
          You are an expert product analyst and pricing specialist. Analyze this product listing and provide comprehensive market insights.
          
          IMPORTANT: Provide ALL text responses (assessment, insights, recommendation, product names, sources) in ${analysisLanguage} language.
          
          PRODUCT DETAILS:
          Name: ${product.name}
          Category: ${product.category}
          Listed Price: ${product.price} ${product.currency}
          Condition: ${product.condition || 'Not specified'}
          Description: ${product.description}
          Tags: ${product.tags?.join(', ') || 'None'}
          Stock: ${product.stock || 1}
          
          YOUR ANALYSIS TASK (respond in ${analysisLanguage}):
          
          1. MARKET PRICE RESEARCH:
             - Based on the product name, category, and condition, estimate the current market price range
             - Consider factors like: brand, model year, condition, features
             - Think about what similar items sell for in the market
             - Provide minimum, maximum, and average market prices in ${product.currency}
          
          2. PRICE VERDICT:
             Compare the listed price (${product.price} ${product.currency}) with market rates:
             - "excellent_deal": Significantly below market (20%+ discount)
             - "fair_price": Within normal market range (±10%)
             - "slightly_high": A bit above market (10-20% higher)
             - "overpriced": Significantly above market (20%+ higher)
             - "underpriced": Suspiciously low (might be too good to be true)
          
          3. MARKET DEMAND ASSESSMENT:
             Evaluate how popular/in-demand this type of product is:
             - Consider category popularity
             - Seasonal factors
             - Technology lifecycle (for electronics)
             - General market trends
          
          4. CONDITION IMPACT (write in ${analysisLanguage}):
             - Assess if the stated condition matches the price
             - Does the condition significantly affect value?
             - Are there common issues with this product type?
          
          5. SIMILAR PRODUCTS (write product names and sources in ${analysisLanguage}):
             List 3-5 similar products you would expect to find in the market:
             - Name (be specific: brand, model if applicable) - in ${analysisLanguage}
             - Estimated price in ${product.currency}
             - Source (online marketplace, retail, etc.) - in ${analysisLanguage}
          
          6. KEY INSIGHTS (write all insights in ${analysisLanguage} - 3-5 bullet points):
             - Important observations about this product
             - Market trends affecting price
             - Features that add/reduce value
             - Condition considerations
             - Any red flags or positive indicators
          
          7. RECOMMENDATION (write in ${analysisLanguage}):
             Provide a clear, actionable recommendation:
             - Should buyers consider this price fair?
             - Is it a good deal or should they negotiate?
             - Any cautions or things to verify?
             - What questions should buyers ask the seller?
          
          8. TRUST SCORE (0-100):
             Based on the listing quality, price reasonableness, and market fit:
             - 90-100: Excellent listing, fair price, detailed info
             - 70-89: Good listing, reasonable price, adequate info
             - 50-69: Average listing, price needs verification
             - 30-49: Concerns about pricing or listing quality
             - 0-29: Significant red flags
          
          IMPORTANT NOTES:
          - ALL TEXT MUST BE IN ${analysisLanguage} LANGUAGE
          - Be realistic about prices in the ${product.currency} market
          - Consider local market conditions for Sri Lanka
          - For electronics: consider depreciation, warranty, age
          - For used items: condition is crucial for pricing
          - If information is limited, mention that in insights
          - Be honest about uncertainty in estimates
          - Write naturally in ${analysisLanguage}, not transliterated English
          
          EXAMPLE GOOD ANALYSIS:
          
          For "iPhone 13 Pro 256GB - Used":
          - Market Price: 180,000-220,000 LKR (avg: 200,000)
          - If listed at 175,000: "excellent_deal"
          - If listed at 195,000: "fair_price"
          - If listed at 240,000: "overpriced"
          - Market Demand: "high" (iPhones always in demand)
          - Condition Impact: Major (screen scratches can reduce 10-15%)
          - Similar Products: iPhone 13 Pro 128GB (~185,000), iPhone 14 (~240,000), Samsung S23 (~210,000)
          - Insights: "iPhone 13 Pro holds value well", "Check battery health", "Verify warranty status"
          - Trust Score: 85 (if good description and realistic price)
        `;

        const model = getGenerativeModel(ai, {
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
          },
        });

        const result = await model.generateContent([prompt]);
        console.log('Product market analysis result:', result.response.text());
        return result.response.text();
      }

      // Handle translation request
      if (request.targetLanguage) {
        const { targetLanguage, content } = request;

        const translationSchema = Schema.object({
          properties: {
            name: Schema.string(),
            description: Schema.string(),
            condition: Schema.string(),
            tags: Schema.array({
              items: Schema.string(),
            }),
          },
        });

        const prompt = `
          Translate the following product details to ${targetLanguage}.
          Maintain the same meaning and context, but translate naturally.
          
          Product Name: ${content.name}
          Description: ${content.description}
          Condition: ${content.condition}
          Tags: ${content.tags.join(', ')}
          
          Return the translated content in JSON format with the same structure.
        `;

        const model = getGenerativeModel(ai, {
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: translationSchema,
          },
        });

        const result = await model.generateContent([prompt]);
        console.log('Translation result:', result.response.text());
        return result.response.text();
      }

      return null;
    } catch (err) {
      console.error('Error processing AI request:', err);
      return null;
    }
  }

  // Handle image analysis request
  if (!imageUri) return null;

  // Define the schema for structured product details
const jsonSchema = Schema.object({
  properties: {
    name: Schema.string(),
    description: Schema.string(),
    category: Schema.enumString({
      enum: ["Electronics", "Furniture", "Books", "Clothing", "Others"],
    }),
    currency: Schema.enumString({
      enum: ["LKR"],
    }),
    price: Schema.number(),
    condition: Schema.string(),
    tags: Schema.array({
      items: Schema.string(),
      maxItems: 3,
    }),
  },
});
  
  try {
    const imagePart = {
      inlineData: { data: await uriToBase64(imageUri), mimeType: 'image/jpeg' },
    };

    const prompt = `
      Generate structured product details for this product image.
    `;

    const model = getGenerativeModel(ai, {
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: jsonSchema,
      },
    });

    // Generate content using the global generativeModel
    const result = await model.generateContent([prompt, imagePart]);
    console.log(result.response.text());
    // The AI will return structured JSON according to the schema
    return result.response.text();
  } catch (err) {
    console.error('Error generating product details:', err);
    return null;
  }
}
