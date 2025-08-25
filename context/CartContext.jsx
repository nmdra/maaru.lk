import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

// Simple storage implementation for demo purposes
// In production, you would use AsyncStorage or expo-secure-store
const storage = {
  async getItem(key) {
    // For now, return null to start with empty cart
    // This can be replaced with actual AsyncStorage when properly installed
    return null;
  },
  async setItem(key, value) {
    // For now, just log the action
    console.log(`Saving cart: ${JSON.stringify(value)}`);
    return Promise.resolve();
  }
};

const CART_STORAGE_KEY = 'shopping_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart items on app start
  useEffect(() => {
    loadCartItems();
  }, []);

  // Save cart items whenever cart changes
  useEffect(() => {
    if (!isLoading) {
      saveCartItems();
    }
  }, [cartItems, isLoading]);

  const loadCartItems = async () => {
    try {
      const savedCart = await storage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCartItems = async () => {
    try {
      await storage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart items:', error);
    }
  };

  // Add item to cart or update quantity if already exists
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  // Remove item from cart completely
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get total price of all items in cart
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      // Only count non-swap items for total
      if (item.swapOnly) return total;
      return total + (item.price * item.quantity);
    }, 0);
  };

  // Get total number of items in cart
  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Get number of unique products in cart
  const getUniqueItemCount = () => {
    return cartItems.length;
  };

  // Check if item is in cart
  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  // Get specific item from cart
  const getCartItem = (productId) => {
    return cartItems.find(item => item.id === productId);
  };

  // Get items by type
  const getPurchaseItems = () => {
    return cartItems.filter(item => !item.swapOnly);
  };

  const getSwapItems = () => {
    return cartItems.filter(item => item.swapOnly);
  };

  const contextValue = {
    // State
    cartItems,
    isLoading,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    
    // Getters
    getCartTotal,
    getCartItemCount,
    getUniqueItemCount,
    isInCart,
    getCartItem,
    getPurchaseItems,
    getSwapItems,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for using cart context
export const useCart = () => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};