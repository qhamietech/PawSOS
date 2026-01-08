import { StyleSheet } from 'react-native';
import { COLORS } from './theme';

/**
 * NEARBY VETS STYLES
 * Focuses on a clean "Directory" feel.
 * Uses soft shadows and specific emoji containers to maintain branding consistency.
 */
export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryDark },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark },
  subtitle: {
    fontSize: 14,
    color: COLORS.grayText,
    marginBottom: 20,
    paddingHorizontal: 5,
    fontWeight: '600',
  },
  listContainer: { padding: 20 },
  vetCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  vetEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetEmoji: { fontSize: 28 },
  vetInfo: { flex: 1, marginLeft: 15 },
  vetName: { fontSize: 16, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 10,
  },
  tierText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  distanceText: { fontSize: 12, color: COLORS.grayText, fontWeight: '600' },
  solvedText: { fontSize: 13, color: '#444', fontWeight: '700' },
  chevron: { fontSize: 20, color: '#CCC', fontWeight: 'bold' }
});