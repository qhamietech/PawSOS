import React from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, 
  SafeAreaView, StatusBar 
} from 'react-native';

// THEME & STYLES
import { COLORS, GlobalStyles } from '../styles/theme';
import { styles } from '../styles/NearbyVetsStyles';

/**
 * NEARBY VETS SCREEN
 * Displays a list of vetted partners nearby.
 * Features: Dynamic tier-based badge coloring and engagement metrics (Solved emergencies).
 */
const NearbyVets = ({ navigation }) => {
  // 1. MOCK DATA (In production, this would come from a GeoFirestore query)
  const vets = [
    { id: '1', name: 'Downtown Animal Clinic', tier: 'Gold', solved: 142, distance: '1.2 km', emoji: '🏥' },
    { id: '2', name: 'Westside Pet Hospital', tier: 'Silver', solved: 89, distance: '2.5 km', emoji: '🐕' },
    { id: '3', name: 'Paws & Claws Care', tier: 'Gold', solved: 210, distance: '3.1 km', emoji: '🐈' },
    { id: '4', name: 'Central Veterinary Center', tier: 'Bronze', solved: 45, distance: '4.8 km', emoji: '🩺' },
  ];

  // 2. TIER COLOR LOGIC
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
        
        {/* HEADER AREA */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nearby Vets</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.listContainer} 
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>Verified professionals in your area</Text>
          
          {/* MAPPING VET CARDS */}
          {vets.map((vet) => (
            <TouchableOpacity 
              key={vet.id} 
              style={styles.vetCard} 
              activeOpacity={0.8}
              onPress={() => {
                // Future: navigation.navigate('VetDetails', { vetId: vet.id })
              }}
            >
              <View style={styles.vetEmojiContainer}>
                <Text style={styles.vetEmoji}>{vet.emoji}</Text>
              </View>
              
              <View style={styles.vetInfo}>
                <Text style={styles.vetName}>{vet.name}</Text>
                <View style={styles.tagRow}>
                  {/* Dynamic background color with 20% opacity */}
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(vet.tier) + '20' }]}>
                    <Text style={[styles.tierText, { color: getTierColor(vet.tier) }]}>
                      ● {vet.tier} Partner
                    </Text>
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

export default NearbyVets;