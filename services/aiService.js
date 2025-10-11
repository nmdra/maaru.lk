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
 * @param {string|null} imageUri - Image URI for product analysis (null for translation)
 * @param {string|null} translationData - JSON string with translation request (null for image analysis)
 * @returns {Promise<Object|null>}
 */
export async function generateProductDetails(imageUri = null, translationData = null) {
  // Handle translation request
  if (translationData && !imageUri) {
    try {
      const translationRequest = JSON.parse(translationData);
      const { targetLanguage, content } = translationRequest;

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
    } catch (err) {
      console.error('Error translating product:', err);
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
