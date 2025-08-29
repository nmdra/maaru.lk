import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebaseConfig.js';

const mockProducts = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'Apple flagship smartphone with A17 Pro chip.',
    price: 499000, // in LKR
    imageUrl: 'https://placehold.co/600x400?text=iPhone+15+Pro+Max',
    category: 'Electronics',
    stock: 10,
    createdAt: new Date(),
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Samsung premium flagship phone.',
    price: 459000,
    imageUrl: 'https://placehold.co/600x400?text=Galaxy+S24+Ultra',
    category: 'Electronics',
    stock: 15,
    createdAt: new Date(),
  },
  {
    name: 'Nike Air Max 270',
    description: 'Stylish and comfortable running shoes.',
    price: 35000,
    imageUrl: 'https://placehold.co/600x400?text=Nike+Air+Max+270',
    category: 'Shoes',
    stock: 25,
    createdAt: new Date(),
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Premium noise-canceling wireless headphones.',
    price: 125000,
    imageUrl: 'https://placehold.co/600x400?text=Sony+WH-1000XM5',
    category: 'Electronics',
    stock: 20,
    createdAt: new Date(),
  },
  {
    name: 'Adidas Ultraboost 5',
    description: 'High-performance running shoes with Boost cushioning.',
    price: 42000,
    imageUrl: 'https://placehold.co/600x400?text=Adidas+Ultraboost+5',
    category: 'Shoes',
    stock: 30,
    createdAt: new Date(),
  },
  {
    name: 'MacBook Air M2',
    description: 'Apple laptop with M2 chip and Retina display.',
    price: 550000,
    imageUrl: 'https://placehold.co/600x400?text=MacBook+Air+M2',
    category: 'Electronics',
    stock: 8,
    createdAt: new Date(),
  },
];

async function seedProducts() {
  try {
    for (const product of mockProducts) {
      await addDoc(collection(db, 'products'), product);
    }
    console.log('Mock products seeded successfully!');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

seedProducts();
