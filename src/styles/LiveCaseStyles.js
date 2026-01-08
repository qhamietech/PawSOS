import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../styles/theme';

/**
 * LIVE CASE SCREEN STYLES
 * High-end Bento-style design system with distinct visual cues
 * for triage states and user roles.
 */
export const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header with dynamic status coloring
  darkHeader: { 
    backgroundColor: COLORS.primaryDark, 
    paddingBottom: 25, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30 
  },
  backButton: { 
    position: 'absolute', 
    left: 20, 
    top: Platform.OS === 'ios' ? 0 : 10, 
    zIndex: 10, 
    padding: 8, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 8 
  },
  backButtonText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  headerContent: { alignItems: 'center' },
  caseIdText: { color: COLORS.accentCoral, fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 40 },
  statusBadge: { 
    marginTop: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 15, 
    backgroundColor: 'rgba(255,255,255,0.2)' 
  },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  // Section Layouts
  section: { marginBottom: 20 },
  label: { fontSize: 11, color: '#888', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  responderCard: { paddingVertical: 15 },
  reportCard: { backgroundColor: '#F9FAFB', borderLeftWidth: 4, borderLeftColor: COLORS.primaryDark },
  bodyText: { fontSize: 15, color: '#444', lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  
  // Typography & UI Elements
  nameText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryDark },
  tierPill: { backgroundColor: COLORS.accentCoral + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, marginTop: 4, alignSelf: 'flex-start' },
  tierText: { color: COLORS.accentCoral, fontSize: 10, fontWeight: '900' },
  callCircle: { backgroundColor: COLORS.accentCoral, width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  
  // Medical Instructions Input
  input: { fontSize: 16, minHeight: 100, textAlignVertical: 'top', padding: 10 },
  charCounter: { textAlign: 'right', fontSize: 10, color: '#aaa', paddingRight: 10 },
  sendBtn: { backgroundColor: COLORS.primaryDark, padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  sendBtnText: { color: 'white', fontWeight: 'bold' },
  
  // Action Buttons
  onWayBtn: { backgroundColor: COLORS.accentAmber, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  onWayText: { color: COLORS.primaryDark, fontWeight: 'bold' },
  resolveBtn: { backgroundColor: '#2ecc71', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  resolveBtnText: { color: 'white', fontWeight: 'bold' },
  escalateBtn: { backgroundColor: COLORS.accentCoral, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  escalateBtnText: { color: 'white', fontWeight: 'bold' },
  takeOverBtn: { backgroundColor: '#8E44AD', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  takeOverBtnText: { color: 'white', fontWeight: 'bold' },

  // Owner-side specific UI
  ownerNoteBox: { padding: 20, backgroundColor: '#EBF5FF', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3498DB' },
  waitingBox: { backgroundColor: '#FDF7E2', borderColor: '#F1C40F' },
  flashHighlight: { backgroundColor: '#FFF9C4', borderColor: COLORS.accentAmber, borderWidth: 2 },
  newUpdateBadge: { alignSelf: 'center', backgroundColor: COLORS.accentAmber, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8, fontSize: 10, fontWeight: 'bold' },
  instructionText: { fontSize: 17, color: COLORS.primaryDark, lineHeight: 25, fontWeight: '600' },
  
  // Notices & Info
  onWayNotice: { marginTop: 20, padding: 15, backgroundColor: COLORS.accentAmber, borderRadius: 15, alignItems: 'center' },
  onWayNoticeText: { fontWeight: 'bold', color: COLORS.primaryDark },
  remoteWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F5FE', padding: 10, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#B3E5FC' },
  remoteWarningText: { color: '#0288D1', fontSize: 12, fontWeight: '800', marginLeft: 8 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  protocolLink: { color: COLORS.primaryDark, fontSize: 11, fontWeight: 'bold', textDecorationLine: 'underline' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, minHeight: 300 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: COLORS.primaryDark },
  templateItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  templateLabel: { fontSize: 16, color: '#444', fontWeight: '600' },
  closeModal: { backgroundColor: COLORS.primaryDark, padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' }
});