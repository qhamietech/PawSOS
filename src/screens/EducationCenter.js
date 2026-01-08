import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, Linking, 
  TextInput, SafeAreaView, StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// THEME & STYLES
import { COLORS, GlobalStyles } from '../styles/theme';
import { styles } from '../styles/EducationCenterStyles';

/**
 * EDUCATION CENTER SCREEN
 * Provides life-saving information accessible even without internet.
 * Features: Local JSON caching via AsyncStorage & External Resource Linking.
 */
const EducationCenter = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('offline');
  const [searchQuery, setSearchQuery] = useState('');
  const [offlineGuides, setOfflineGuides] = useState([]);

  // 1. DATA SOURCE: Initial local data (Fallback)
  const initialGuides = [
    { id: '1', title: '🐾 Dog/Cat CPR', content: '1. Check for pulse.\n2. 30 compressions followed by 2 breaths.\n3. Repeat until help arrives.', color: COLORS.accentCoral },
    { id: '2', title: '🐍 Snake Bites (SA)', content: '1. Keep pet calm and still.\n2. Keep bite area BELOW heart level.\n3. Identify snake if possible, but DO NOT approach it.', color: '#e67e22' },
    { id: '3', title: '🦂 Scorpion Stings', content: '1. Immobilize the limb.\n2. Apply a cool compress (not ice).\n3. Seek vet help for anti-venom.', color: '#f1c40f' },
    { id: '4', title: '🍫 Chocolate Poisoning', content: '1. Call vet immediately.\n2. Note type of chocolate & amount.\n3. Do not induce vomiting unless told.', color: '#8e44ad' },
  ];

  // 2. RESOURCE DATA: External emergency links
  const onlineResources = [
    { id: '5', title: 'ASPCA Poison Control', url: 'https://www.aspca.org/pet-care/animal-poison-control', source: 'External Website' },
    { id: '6', title: 'PetMD Emergency Care', url: 'https://www.petmd.com/dog/emergency', source: 'External Website' },
    { id: '7', title: 'South African Vet Association', url: 'https://sava.co.za/', source: 'Local Resource' }
  ];

  // 3. OFFLINE CACHING LOGIC
  useEffect(() => {
    const loadGuides = async () => {
      try {
        const savedGuides = await AsyncStorage.getItem('@offline_guides');
        if (savedGuides !== null) {
          setOfflineGuides(JSON.parse(savedGuides));
        } else {
          // First time use: Cache the initial data
          setOfflineGuides(initialGuides);
          await AsyncStorage.setItem('@offline_guides', JSON.stringify(initialGuides));
        }
      } catch (e) {
        setOfflineGuides(initialGuides);
      }
    };
    loadGuides();
  }, []);

  // 4. FILTER LOGIC
  const filteredOffline = offlineGuides.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOnline = onlineResources.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 5. RENDER HELPERS
  const renderOfflineItem = ({ item }) => (
    <View style={[styles.offlineCard, { borderLeftColor: item.color }]}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody}>{item.content}</Text>
    </View>
  );

  const renderOnlineItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.onlineCard} 
      onPress={() => Linking.openURL(item.url)}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.sourceText}>{item.source}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HERO HEADER */}
      <LinearGradient 
        colors={[COLORS.primaryDark, COLORS.surfaceDark]} 
        style={styles.hero}
      >
        <SafeAreaView>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
               <Text style={{fontSize: 20, color: 'white'}}>⬅️</Text>
            </TouchableOpacity>
            <Text style={styles.headerLabel}>LEARNING HUB</Text>
            <View style={{width: 40}} />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.welcomeText}>First Aid 💊</Text>
            <Text style={styles.heroTitle}>Essential guides for{"\n"}emergency care.</Text>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search symptoms or guides..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* TAB SWITCHER */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'offline' && styles.activeTab]} 
          onPress={() => setActiveTab('offline')}
        >
          <Text style={[styles.tabText, activeTab === 'offline' && styles.activeTabText]}>Offline Docs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'online' && styles.activeTab]} 
          onPress={() => setActiveTab('online')}
        >
          <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>Online Resources</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <FlatList
        data={activeTab === 'offline' ? filteredOffline : filteredOnline}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'offline' ? renderOfflineItem : renderOnlineItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No guides found for "{searchQuery}"</Text>
        }
      />
      
      {/* OFFLINE INDICATOR */}
      {activeTab === 'offline' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>✓ DOWNLOADED FOR OFFLINE USE</Text>
        </View>
      )}
    </View>
  );
};

export default EducationCenter;