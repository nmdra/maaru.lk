/**
 * 🎨 Maaru.LK Professional Color Palette
 * Brand Color: #d3854d (Warm Orange)
 * Design System: 60-30-10 Rule
 * 
 * 60% - Neutral backgrounds for clean, modern look
 * 30% - Warm supporting colors for depth and separation  
 * 10% - Brand orange for key actions and highlights
 */

const Colors = {
  // ═══════════════════════════════════════════════════════
  // PRIMARY COLORS (60% Usage) - Backgrounds & Main Surfaces
  // ═══════════════════════════════════════════════════════
  primary: '#FAFAFA',           // Main background - Clean warm gray
  primaryLight: '#FFFFFF',      // Elevated cards & surfaces - Pure white
  primaryDark: '#F5F5F5',       // Subtle contrast areas
  
  // ═══════════════════════════════════════════════════════
  // SECONDARY COLORS (30% Usage) - Supporting Elements
  // ═══════════════════════════════════════════════════════
  secondary: '#E8E5E1',         // Dividers, borders, inactive states
  secondaryLight: '#F2F0ED',    // Subtle backgrounds, hover states
  secondaryDark: '#D1CEC9',     // Stronger borders, disabled states
  
  // ═══════════════════════════════════════════════════════
  // ACCENT COLORS (10% Usage) - Brand & Key Actions
  // ═══════════════════════════════════════════════════════
  accent: '#d3854d',            // 🔥 PRIMARY BRAND COLOR - CTAs, Active states
  accentLight: '#e09d6b',       // Hover states, lighter highlights
  accentDark: '#b86f3d',        // Pressed states, darker emphasis
  accentSoft: '#f5e8dc',        // Very light tint for backgrounds/badges
  
  // ═══════════════════════════════════════════════════════
  // NEUTRAL COLORS - Versatile Grays
  // ═══════════════════════════════════════════════════════
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',              // Lightest
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',             // Medium - Good for icons
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',             // Darkest - Primary text
  },
  
  // ═══════════════════════════════════════════════════════
  // SEMANTIC COLORS - Status & Feedback
  // ═══════════════════════════════════════════════════════
  success: '#10B981',           // Green - Success states
  successLight: '#D1FAE5',      // Light green background
  error: '#EF4444',             // Red - Error states
  errorLight: '#FEE2E2',        // Light red background
  warning: '#F59E0B',           // Amber - Warning states
  warningLight: '#FEF3C7',      // Light amber background
  info: '#3B82F6',              // Blue - Info states
  infoLight: '#DBEAFE',         // Light blue background
  
  // ═══════════════════════════════════════════════════════
  // TEXT COLORS - Typography Hierarchy
  // ═══════════════════════════════════════════════════════
  text: {
    primary: '#212121',         // Main headings, important text
    secondary: '#616161',       // Body text, descriptions
    tertiary: '#9E9E9E',        // Subtle text, placeholders
    disabled: '#BDBDBD',        // Disabled text
    inverse: '#FFFFFF',         // Text on dark backgrounds
    accent: '#d3854d',          // Branded text, links
  },
  
  // ═══════════════════════════════════════════════════════
  // BACKGROUND COLORS - Surface Hierarchy
  // ═══════════════════════════════════════════════════════
  background: {
    primary: '#FAFAFA',         // Main app background
    secondary: '#FFFFFF',       // Cards, elevated surfaces
    tertiary: '#F5F5F5',        // Subtle sections
    accent: '#f5e8dc',          // Accent backgrounds (very light orange)
    overlay: 'rgba(0,0,0,0.5)', // Modal overlays
  },
  
  // ═══════════════════════════════════════════════════════
  // BORDER COLORS - Separation & Definition
  // ═══════════════════════════════════════════════════════
  border: {
    light: '#F5F5F5',           // Very subtle borders
    default: '#E8E5E1',         // Standard borders
    medium: '#D1CEC9',          // Emphasized borders
    dark: '#BDBDBD',            // Strong borders
    accent: '#d3854d',          // Branded borders
  },
  
  // ═══════════════════════════════════════════════════════
  // COMPONENT-SPECIFIC COLORS
  // ═══════════════════════════════════════════════════════
  button: {
    primary: '#d3854d',         // Primary button background
    primaryHover: '#e09d6b',    // Primary button hover
    primaryPressed: '#b86f3d',  // Primary button pressed
    secondary: '#FFFFFF',       // Secondary button background
    secondaryBorder: '#E8E5E1', // Secondary button border
    disabled: '#E0E0E0',        // Disabled button
    disabledText: '#BDBDBD',    // Disabled button text
  },
  
  input: {
    background: '#FFFFFF',      // Input field background
    border: '#E8E5E1',          // Input border
    borderFocus: '#d3854d',     // Input border on focus
    placeholder: '#9E9E9E',     // Placeholder text
    text: '#212121',            // Input text
  },
  
  card: {
    background: '#FFFFFF',      // Card background
    border: '#F5F5F5',          // Card border
    shadow: 'rgba(0,0,0,0.08)', // Card shadow
  },
  
  navigation: {
    background: '#FFFFFF',      // Nav bar background
    border: '#E8E5E1',          // Nav bar top border
    active: '#d3854d',          // Active tab color
    inactive: '#9E9E9E',        // Inactive tab color
  },
};

export default Colors;
