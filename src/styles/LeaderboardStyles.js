import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from './theme';

const { width } = Dimensions.get('window');

/**
 * LEADERBOARD SCREEN STYLES
 * High-end visual hierarchy focusing on a "Podium" hero section
 * and a clean, scannable list for community standings.
 */
export const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header & Podium Section
  hero: { 
    paddingTop: 10, 
    paddingBottom: 30, 
    paddingHorizontal: 25, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40 
  },
  topRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerLabel: { 
    color: 'rgba(255,255,255,0.5)', 
    fontWeight: '900', 
    fontSize: 10, 
    letterSpacing: 2 
  },
  titleSection: { marginBottom: 10 },
  welcomeText: { color: 'white', fontSize: 32, fontWeight: '900' },
  heroTitle: { 
    color: COLORS.accentCoral, 
    fontSize: 14, 
    fontWeight: '700', 
    marginTop: 4 
  },
  
  // Podium Visualizer
  podiumWrapper: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'flex-end', 
    marginTop: 20,
    height: 140
  },
  podiumMember: { 
    alignItems: 'center', 
    width: width / 4, 
    marginHorizontal: 10 
  },
  podiumCircle: { 
    width: 55, 
    height: 55, 
    borderRadius: 30, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8
  },
  goldCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderColor: '#FFD700', 
    borderWidth: 2,
    marginBottom: 12
  },
  podiumEmoji: { fontSize: 24 },
  podiumName: { color: 'white', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  podiumPoints: { color: COLORS.accentCoral, fontSize: 10, fontWeight: '800' },

  // List Standing Styles
  listContent: { padding: 25, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryDark, marginBottom: 20 },
  leaderCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 22,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8
  },
  rankBadge: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '900', color: COLORS.primaryDark },
  
  infoContainer: { flex: 1, marginLeft: 12 },
  nameText: { fontSize: 16, fontWeight: '800', color: COLORS.primaryDark },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  tierTag: { 
    backgroundColor: '#f1f2f6', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginRight: 8
  },
  tierTagText: { fontSize: 9, fontWeight: '900', color: '#7f8c8d' },
  livesHelpedText: { fontSize: 10, color: '#95a5a6', fontWeight: '700' },

  pointsPill: { 
    backgroundColor: COLORS.primaryDark, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    alignItems: 'center',
    minWidth: 55
  },
  pointsText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  ptsLabel: { color: COLORS.accentCoral, fontSize: 7, fontWeight: '900' },
  
  emptyText: { textAlign: 'center', marginTop: 50, color: '#95a5a6', fontWeight: '600' }
});