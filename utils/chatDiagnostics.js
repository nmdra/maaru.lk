// utils/chatDiagnostics.js
/**
 * Chat System Diagnostics
 * Run this to check if everything is configured correctly
 */

import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { getSocket } from '../services/socket';

export async function runChatDiagnostics() {
  const results = {
    auth: { status: '❌', message: '' },
    socket: { status: '❌', message: '' },
    firestore: { status: '❌', message: '' },
    conversations: { status: '❌', message: '', count: 0 },
    cloudinary: { status: '❌', message: '' },
  };

  console.log('\n🔍 === CHAT SYSTEM DIAGNOSTICS ===\n');

  // 1. Check Firebase Auth
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      results.auth.status = '✅';
      results.auth.message = `Logged in as: ${user.email || user.uid}`;
      console.log('✅ Firebase Auth: User logged in');
      console.log(`   User ID: ${user.uid}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
    } else {
      results.auth.status = '❌';
      results.auth.message = 'Not logged in';
      console.log('❌ Firebase Auth: No user logged in');
    }
  } catch (error) {
    results.auth.status = '❌';
    results.auth.message = `Error: ${error.message}`;
    console.log('❌ Firebase Auth: Error -', error.message);
  }

  // 2. Check Socket.io Connection
  try {
    const socket = getSocket();
    
    if (socket) {
      if (socket.connected) {
        results.socket.status = '✅';
        results.socket.message = `Connected (ID: ${socket.id})`;
        console.log('✅ Socket.io: Connected');
        console.log(`   Socket ID: ${socket.id}`);
      } else {
        results.socket.status = '⚠️';
        results.socket.message = 'Socket exists but disconnected';
        console.log('⚠️  Socket.io: Socket exists but not connected');
      }
    } else {
      results.socket.status = '❌';
      results.socket.message = 'Socket not initialized';
      console.log('❌ Socket.io: Not initialized');
      console.log('   Run initSocket() in AuthContext');
    }
  } catch (error) {
    results.socket.status = '❌';
    results.socket.message = `Error: ${error.message}`;
    console.log('❌ Socket.io: Error -', error.message);
  }

  // 3. Check Firestore Connection
  try {
    const testQuery = query(collection(db, 'conversations'), limit(1));
    await getDocs(testQuery);
    
    results.firestore.status = '✅';
    results.firestore.message = 'Connected and accessible';
    console.log('✅ Firestore: Connected');
  } catch (error) {
    results.firestore.status = '❌';
    results.firestore.message = `Error: ${error.message}`;
    console.log('❌ Firestore: Error -', error.message);
  }

  // 4. Check Conversations Collection
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const q = query(collection(db, 'conversations'), limit(100));
      const snapshot = await getDocs(q);
      
      const userConversations = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.participants && data.participants.includes(user.uid);
      });
      
      results.conversations.count = userConversations.length;
      
      if (userConversations.length > 0) {
        results.conversations.status = '✅';
        results.conversations.message = `Found ${userConversations.length} conversation(s)`;
        console.log(`✅ Conversations: Found ${userConversations.length} conversation(s)`);
        
        userConversations.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   ${index + 1}. ${doc.id}`);
          console.log(`      Participants: ${data.participants?.join(', ')}`);
          console.log(`      Product: ${data.productCard?.title || 'N/A'}`);
        });
      } else {
        results.conversations.status = '⚠️';
        results.conversations.message = 'No conversations found';
        console.log('⚠️  Conversations: None found for this user');
        console.log('   Create a conversation by chatting with a product owner');
      }
    } else {
      results.conversations.status = '❌';
      results.conversations.message = 'Cannot check - not logged in';
      console.log('❌ Conversations: Cannot check - not logged in');
    }
  } catch (error) {
    results.conversations.status = '❌';
    results.conversations.message = `Error: ${error.message}`;
    console.log('❌ Conversations: Error -', error.message);
  }

  // 5. Check Cloudinary Configuration
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
    
    if (cloudName && apiKey) {
      results.cloudinary.status = '✅';
      results.cloudinary.message = `Configured (Cloud: ${cloudName})`;
      console.log('✅ Cloudinary: Configured');
      console.log(`   Cloud Name: ${cloudName}`);
      console.log(`   API Key: ${apiKey?.substring(0, 8)}...`);
      console.log('   ⚠️  Remember to create "chat_images" upload preset!');
    } else {
      results.cloudinary.status = '❌';
      results.cloudinary.message = 'Missing credentials in .env';
      console.log('❌ Cloudinary: Missing credentials in .env');
    }
  } catch (error) {
    results.cloudinary.status = '❌';
    results.cloudinary.message = `Error: ${error.message}`;
    console.log('❌ Cloudinary: Error -', error.message);
  }

  console.log('\n=== BACKEND CHECK ===\n');
  
  // 6. Check Backend Connection
  try {
    const wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:8080';
    console.log(`🔗 Backend URL: ${wsUrl}`);
    console.log('   Check if backend is running:');
    console.log(`   Visit: ${wsUrl}/health`);
    console.log('   Should return: { "status": "ok" }\n');
  } catch (error) {
    console.log('❌ Backend: Error -', error.message);
  }

  console.log('=== SUMMARY ===\n');
  
  const allGood = Object.values(results).every(r => r.status === '✅');
  
  if (allGood) {
    console.log('🎉 All systems operational!');
    console.log('   Your chat is ready to use.');
  } else {
    console.log('⚠️  Some issues detected:');
    
    Object.entries(results).forEach(([key, value]) => {
      if (value.status !== '✅') {
        console.log(`   ${value.status} ${key}: ${value.message}`);
      }
    });
    
    console.log('\n📚 Read CHAT_SETUP_GUIDE.md for troubleshooting');
  }

  console.log('\n=== END DIAGNOSTICS ===\n');
  
  return results;
}

// Auto-run diagnostics if needed
export async function checkChatReadiness() {
  const auth = getAuth();
  const user = auth.currentUser;
  const socket = getSocket();
  
  const isReady = {
    auth: !!user,
    socket: socket?.connected || false,
  };
  
  if (!isReady.auth) {
    console.warn('⚠️  Chat not ready: User not logged in');
    return false;
  }
  
  if (!isReady.socket) {
    console.warn('⚠️  Chat not ready: WebSocket not connected');
    console.warn('   Backend might not be running');
    return false;
  }
  
  return true;
}
