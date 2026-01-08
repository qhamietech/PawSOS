import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const BRAND = {
  primaryDark: '#1a1a2e',
  accentCoral: '#FF6B6B',
  accentAmber: '#FFB86C',
  pureWhite: '#FFFFFF',
  ghostWhite: '#F8F9FA',
  successGreen: '#2ecc71',
};

export const COLORS = {
  // Deep, elegant dark tones
  primaryDark: '#1A1A1A',     // Deepest Charcoal
  surfaceDark: '#2D2D2D',     // Lighter Charcoal for cards
  
  // High-end accent colors
  accentCoral: '#FF7E67',     // Sophisticated Coral
  accentAmber: '#FFB347',     // Warm glow for secondary actions
  
  // Neutrals
  offWhite: '#FDFDFD',
  ghostWhite: '#F5F7FA',
  grayText: '#A0A0A0',
  pureWhite: '#FFFFFF',
};

export const GlobalStyles = StyleSheet.create({
  // Clean, white-space heavy container
  container: {
    flex: 1,
    backgroundColor: COLORS.ghostWhite,
  },
  inner: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  // Bento-style card with soft, premium shadow
  card: {
    backgroundColor: COLORS.pureWhite,
    padding: 25,
    borderRadius: 35,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  input: {
    backgroundColor: COLORS.ghostWhite,
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  // The dark capsule button
  mainButton: {
    backgroundColor: COLORS.primaryDark,
    padding: 20,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.pureWhite,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1.2,
  },
  // Added helper for consistent sub-titles in the dashboard
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 20,
  }
});