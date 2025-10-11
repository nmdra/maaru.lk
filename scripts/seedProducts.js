import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig.js';

const mockProducts = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'Apple flagship smartphone with A17 Pro chip.',
    price: 499000, // in LKR
    imageUrl: 'https://placehold.co/600x400?text=iPhone+15+Pro+Max',
    category: 'Electronics',
    stock: 10,
    condition: 'New',
    swapOnly: false,
    tags: ['Good Condition', 'New Arrival'],
    ownerId: 'NcxDP17pIDNS1Y7Gxkdwr2Arfbn1',
    createdAt: serverTimestamp(),
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Samsung premium flagship phone.',
    price: 459000,
    imageUrl: 'https://placehold.co/600x400?text=Galaxy+S24+Ultra',
    category: 'Electronics',
    stock: 15,
    condition: 'New',
    swapOnly: false,
    tags: ['Limited Time'],
    ownerId: 'NcxDP17pIDNS1Y7Gxkdwr2Arfbn1',
    createdAt: serverTimestamp(),
  },
  {
    name: 'Nike Air Max 270',
    description: 'Stylish and comfortable running shoes.',
    price: 35000,
    imageUrl: 'https://placehold.co/600x400?text=Nike+Air+Max+270',
    category: 'Shoes',
    stock: 25,
    condition: 'New',
    swapOnly: false,
    tags: ['Good Condition'],
    ownerId: 'NcxDP17pIDNS1Y7Gxkdwr2Arfbn1',
    createdAt: serverTimestamp(),
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Premium noise-canceling wireless headphones.',
    price: 125000,
    imageUrl: 'https://placehold.co/600x400?text=Sony+WH-1000XM5',
    category: 'Electronics',
    stock: 20,
    condition: 'Like New',
    swapOnly: false,
    tags: ['Good Condition'],
    ownerId: 'RrygpUGnigObERkAuhXA6yQVoeT2',
    createdAt: serverTimestamp(),
  },
  {
    name: 'Adidas Ultraboost 5',
    description: 'High-performance running shoes with Boost cushioning.',
    price: 42000,
    imageUrl: 'https://placehold.co/600x400?text=Adidas+Ultraboost+5',
    category: 'Shoes',
    stock: 30,
    condition: 'New',
    swapOnly: false,
    tags: ['New Arrival'],
    ownerId: 'RrygpUGnigObERkAuhXA6yQVoeT2',
    createdAt: serverTimestamp(),
  },
  {
    name: 'MacBook Air M2',
    description: 'Apple laptop with M2 chip and Retina display.',
    price: 550000,
    imageUrl: 'https://placehold.co/600x400?text=MacBook+Air+M2',
    category: 'Electronics',
    stock: 8,
    condition: 'New',
    swapOnly: false,
    tags: ['New Arrival', 'Limited Time'],
    ownerId: 'RrygpUGnigObERkAuhXA6yQVoeT2',
    createdAt: serverTimestamp(),
  },
  // New product example
  {
    name: 'The Three-Body Problem',
    description: 'Science fiction novel by Liu Cixin.',
    price: 2500,
    imageUrl: 'https://placehold.co/200x300?text=The+Three-Body+Problem',
    category: 'Books',
    stock: 50,
    condition: 'New',
    swapOnly: false,
    tags: ['Good Condition', 'Bestseller'],
    ownerId: 'RrygpUGnigObERkAuhXA6yQVoeT2',
    createdAt: serverTimestamp(),
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
