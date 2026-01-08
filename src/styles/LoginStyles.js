import { StyleSheet } from 'react-native';
import { COLORS } from './theme';

/**
 * LOGIN SCREEN STYLES
 * Uses absolute positioning for decorative elements to create depth 
 * without interfering with the form's usability.
 */
export const styles = StyleSheet.create({
  headerArea: {
    width: '100%',
    marginBottom: 10, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: 250,
  },
  passwordWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    position: 'relative', 
  },
  eyeIcon: {
    position: 'absolute',
    right: 15, 
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    width: 40,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 5,
  },
  forgotPasswordText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  footerLinks: { 
    marginTop: 40, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  linkText: { 
    color: COLORS.primaryDark, 
    fontSize: 14,
    opacity: 0.9
  },
  bold: {
    fontWeight: '800',
    color: COLORS.accentCoral,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    marginHorizontal: 15,
    opacity: 0.5
  },
  bgPawTop: {
    position: 'absolute',
    top: 40,
    right: -20,
    transform: [{ rotate: '30deg' }],
    opacity: 0.06,
  },
  bgPawBottom: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    transform: [{ rotate: '-20deg' }],
    opacity: 0.06,
  }
});