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
