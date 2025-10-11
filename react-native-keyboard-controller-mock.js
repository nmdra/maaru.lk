// Mock for react-native-keyboard-controller to work with Expo Go
// This package requires native modules that aren't available in Expo Go

export const KeyboardController = {
  setInputMode: () => {},
  setDefaultMode: () => {},
  dismiss: () => {},
};

export const KeyboardEvents = {
  addListener: () => ({ remove: () => {} }),
};

export const useKeyboardController = () => ({
  enabled: false,
  height: 0,
});

export const useReanimatedKeyboardAnimation = () => ({
  height: { value: 0 },
  progress: { value: 0 },
  state: { value: 0 },
});

export const useKeyboardAnimation = () => ({
  height: 0,
  progress: 0,
  state: 0,
});

export const KeyboardProvider = ({ children }) => children;

export const KeyboardGestureArea = ({ children }) => children;

export const KeyboardAwareScrollView = ({ children, ...props }) => {
  const { ScrollView } = require('react-native');
  return <ScrollView {...props}>{children}</ScrollView>;
};

export default {
  KeyboardController,
  KeyboardEvents,
  useKeyboardController,
  useReanimatedKeyboardAnimation,
  useKeyboardAnimation,
  KeyboardProvider,
  KeyboardGestureArea,
  KeyboardAwareScrollView,
};
