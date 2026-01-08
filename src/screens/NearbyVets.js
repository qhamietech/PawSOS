import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { COLORS, GlobalStyles } from '../styles/theme';

const { width } = Dimensions.get('window');

const NearbyVets = ({ navigation }) => {
  // Mock data for the demo
  const vets = [
    { id: '1', name: 'Downtown Animal Clinic', tier: 'Gold', solved: 142, distance: '1.2 km', emoji: '🏥' },
    { id: '2', name: 'Westside Pet Hospital', tier: 'Silver', solved: 89, distance: '2.5 km', emoji: '🐕' },
    { id: '3', name: 'Paws & Claws Care', tier: 'Gold', solved: 210, distance: '3.1 km', emoji: '🐈' },
    { id: '4', name: 'Central Veterinary Center', tier: 'Bronze', solved: 45, distance: '4.8 km', emoji: '🩺' },
  ];

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      case 'Bronze': return '#CD7F32';
      default: return COLORS.grayText;
    }
  };

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nearby Vets</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Verified professionals in your area</Text>
          
          {vets.map((vet) => (
            <TouchableOpacity key={vet.id} style={styles.vetCard} activeOpacity={0.7}>
              <View style={styles.vetEmojiContainer}>
                <Text style={styles.vetEmoji}>{vet.emoji}</Text>
              </View>
              
              <View style={styles.vetInfo}>
                <Text style={styles.vetName}>{vet.name}</Text>
                <View style={styles.tagRow}>
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(vet.tier) + '20' }]}>
                    <Text style={[styles.tierText, { color: getTierColor(vet.tier) }]}>● {vet.tier} Partner</Text>
                  </View>
                  <Text style={styles.distanceText}>{vet.distance}</Text>
                </View>
                <Text style={styles.solvedText}>✅ {vet.solved} Emergencies Solved</Text>
              </View>
              
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.pureWhite,
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
    backgroundColor: COLORS.pureWhite,
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
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

export default NearbyVets;