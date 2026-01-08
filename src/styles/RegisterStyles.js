import { StyleSheet } from 'react-native';
import { COLORS } from './theme';

/**
 * REGISTRATION STYLES
 * Optimized for long forms to ensure all fields are visible 
 * and accessible on smaller devices.
 */
export const styles = StyleSheet.create({
  headerArea: {
    width: '100%',
    marginBottom: 5, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: 160, // Adjusted height to prevent excessive scrolling
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: -10,
    marginBottom: 10,
    textAlign: 'center'
  },
  passwordWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative', 
  },
  eyeIcon: {
    position: 'absolute',
    right: 12, 
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, 
    width: 30, 
  },
  backBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 10
  },
  backBtnText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    opacity: 0.8,
  },
  bgPawTop: {
    position: 'absolute',
    top: 40,
    right: -20,
    transform: [{ rotate: '30deg' }],
    opacity: 0.05,
  },
  bgPawBottom: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    transform: [{ rotate: '-20deg' }],
    opacity: 0.05,
  }
});