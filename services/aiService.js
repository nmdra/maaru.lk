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
 * @param {string} imageUri
 * @returns {Promise<Object|null>}
 */
export async function generateProductDetails(imageUri) {
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
