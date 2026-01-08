import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../styles/theme';

const { width } = Dimensions.get('window');

/**
 * EDUCATION CENTER STYLES
 * Features a high-contrast Hero section and "Bento-box" cards
 * for quick readability during high-stress emergencies.
 */
export const styles = StyleSheet.create({
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
    fontSize: 12, 
    letterSpacing: 2 
  },
  titleSection: { marginBottom: 20 },
  welcomeText: { color: 'white', fontSize: 32, fontWeight: '900' },
  heroTitle: { 
    color: COLORS.accentCoral, 
    fontSize: 16, 
    fontWeight: '700', 
    marginTop: 4 
  },
  searchContainer: { width: '100%' },
  searchInput: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    padding: 15, 
    borderRadius: 15, 
    color: 'white', 
    fontSize: 16,
    fontWeight: '600'
  },
  tabContainer: { 
    flexDirection: 'row', 
    marginTop: 20, 
    marginHorizontal: 25,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 15,
    padding: 5
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 12 
  },
  activeTab: { backgroundColor: 'white', elevation: 2 },
  tabText: { fontWeight: '800', color: '#AAAAAA', fontSize: 13 },
  activeTabText: { color: COLORS.primaryDark },
  listContent: { padding: 25, paddingBottom: 100 },
  
  // Offline Guide Cards
  offlineCard: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 25, 
    marginBottom: 15, 
    borderLeftWidth: 8, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10 
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: COLORS.primaryDark, 
    marginBottom: 8 
  },
  cardBody: { 
    fontSize: 14, 
    color: '#555', 
    lineHeight: 22,
    fontWeight: '500' 
  },

  // Online Resource Cards
  onlineCard: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 25, 
    marginBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    elevation: 3 
  },
  sourceText: { 
    fontSize: 12, 
    color: COLORS.accentCoral, 
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  arrow: { fontSize: 20, color: '#DDD' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#AAA', fontWeight: '700' },

  // Offline indicator
  offlineBanner: { 
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#2ecc71', 
    padding: 10, 
    alignItems: 'center' 
  },
  offlineBannerText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 }
});