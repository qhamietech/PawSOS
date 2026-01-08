import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, TextInput, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme';

const { width } = Dimensions.get('window');

const EducationCenter = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('offline');
  const [searchQuery, setSearchQuery] = useState('');
  const [offlineGuides, setOfflineGuides] = useState([]);

  // 1. OFFLINE DATA SOURCE (Initial)
  const initialGuides = [
    { id: '1', title: '🐾 Dog/Cat CPR', content: '1. Check for pulse.\n2. 30 compressions followed by 2 breaths.\n3. Repeat until help arrives.', color: COLORS.accentCoral || '#FF6B6B' },
    { id: '2', title: '蛇 Snake Bites (SA)', content: '1. Keep pet calm and still.\n2. Keep bite area BELOW heart level.\n3. Identify snake if possible, but DO NOT approach it.', color: '#e67e22' },
    { id: '3', title: '🦂 Scorpion Stings', content: '1. Immobilize the limb.\n2. Apply a cool compress (not ice).\n3. Seek vet help for anti-venom.', color: '#f1c40f' },
    { id: '4', title: '🍫 Chocolate Poisoning', content: '1. Call vet immediately.\n2. Note type of chocolate & amount.\n3. Do not induce vomiting unless told.', color: '#8e44ad' },
  ];

  // 2. OFFLINE CACHING LOGIC
  useEffect(() => {
    const loadGuides = async () => {
      try {
        const savedGuides = await AsyncStorage.getItem('@offline_guides');
        if (savedGuides !== null) {
          setOfflineGuides(JSON.parse(savedGuides));
        } else {
          setOfflineGuides(initialGuides);
          await AsyncStorage.setItem('@offline_guides', JSON.stringify(initialGuides));
        }
      } catch (e) {
        setOfflineGuides(initialGuides);
      }
    };
    loadGuides();
  }, []);

  // ONLINE DATA
  const onlineResources = [
    { id: '5', title: 'ASPCA Poison Control', url: 'https://www.aspca.org/pet-care/animal-poison-control', source: 'External Website' },
    { id: '6', title: 'PetMD Emergency Care', url: 'https://www.petmd.com/dog/emergency', source: 'External Website' },
    { id: '7', title: 'South African Vet Association', url: 'https://sava.co.za/', source: 'Local Resource' }
  ];

  const filteredOffline = offlineGuides.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOnline = onlineResources.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOfflineItem = ({ item }) => (
    <View style={[styles.offlineCard, { borderLeftColor: item.color }]}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody}>{item.content}</Text>
    </View>
  );

  const renderOnlineItem = ({ item }) => (
    <TouchableOpacity style={styles.onlineCard} onPress={() => Linking.openURL(item.url)}>
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
      <LinearGradient colors={[COLORS.primaryDark || '#1A1A1A', COLORS.surfaceDark || '#333333']} style={styles.hero}>
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
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* TABS */}
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
      
      {activeTab === 'offline' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>✓ DOWNLOADED FOR OFFLINE USE</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: COLORS.accentCoral || '#FF6B6B', 
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
  activeTabText: { color: COLORS.primaryDark || '#1A1A1A' },
  listContent: { padding: 25, paddingBottom: 100 },
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
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: COLORS.primaryDark || '#1A1A1A', 
    marginBottom: 8 
  },
  cardBody: { 
    fontSize: 14, 
    color: '#555', 
    lineHeight: 22,
    fontWeight: '500' 
  },
  sourceText: { 
    fontSize: 12, 
    color: COLORS.accentCoral || '#FF6B6B', 
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  arrow: { fontSize: 20, color: '#DDD' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#AAA', fontWeight: '700' },
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

export default EducationCenter;