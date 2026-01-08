import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from './theme';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  hero: { 
    paddingTop: 20, 
    paddingBottom: 60, 
    paddingHorizontal: 25, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40 
  },
  topActionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  logoutContent: { flexDirection: 'row', alignItems: 'center' },
  logoutText: { color: '#AAAAAA', fontWeight: 'bold', fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  heroTitle: { 
    color: COLORS.accentCoral, 
    fontSize: 16, 
    fontWeight: '700', 
    marginTop: 4, 
    opacity: 0.9 
  },
  profileIcon: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    width: 60, 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  actionInner: { alignItems: 'center', paddingVertical: 10 },
  activePulse: { 
    backgroundColor: COLORS.accentCoral, 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  pulseText: { color: 'white', fontSize: 10, fontWeight: '900' },
  sosCircle: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    backgroundColor: 'white', 
    padding: 10, 
    shadowColor: COLORS.accentCoral, 
    shadowOpacity: 0.4, 
    shadowRadius: 15, 
    elevation: 15 
  },
  sosGradient: { flex: 1, borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
  sosText: { color: 'white', fontSize: 32, fontWeight: '900' },
  sosSubtext: { 
    marginTop: 15, 
    color: COLORS.primaryDark, 
    fontWeight: '800', 
    fontSize: 14, 
    opacity: 0.6 
  },
  section: { padding: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primaryDark, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { 
    backgroundColor: 'white', 
    width: (width - 70) / 2, 
    padding: 20, 
    borderRadius: 25, 
    marginBottom: 20, 
    alignItems: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 5 
  },
  activeGridItem: { borderColor: COLORS.accentCoral, borderWidth: 2 },
  emojiCircle: { 
    backgroundColor: '#F8F9FB', 
    width: 65, 
    height: 65, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  gridEmoji: { fontSize: 30 },
  gridLabel: { fontWeight: '800', color: COLORS.primaryDark, fontSize: 13 },
  badgeCount: { 
    position: 'absolute', 
    top: -5, 
    right: -5, 
    backgroundColor: COLORS.accentCoral, 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'white' 
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 25, 
    paddingBottom: 40 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark },
  caseItem: { backgroundColor: '#F8F9FB', padding: 15, borderRadius: 15, marginBottom: 15 },
  caseItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseItemStatus: { color: COLORS.accentCoral, fontWeight: '900', fontSize: 12 },
  caseItemSymptoms: { fontSize: 14, color: '#333', marginTop: 5 }
});