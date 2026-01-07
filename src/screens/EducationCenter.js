import React, { useState, useEffect } from 'react'; // Added useEffect
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Ensure this is installed

const EducationCenter = () => {
  const [activeTab, setActiveTab] = useState('offline');
  const [searchQuery, setSearchQuery] = useState('');
  const [offlineGuides, setOfflineGuides] = useState([]); // State for guides

  // 1. OFFLINE DATA SOURCE (Initial)
  const initialGuides = [
    { id: '1', title: '🐾 Dog/Cat CPR', content: '1. Check for pulse.\n2. 30 compressions followed by 2 breaths.\n3. Repeat until help arrives.', color: '#d63031' },
    { id: '2', title: '🐍 Snake Bites (SA)', content: '1. Keep pet calm and still.\n2. Keep bite area BELOW heart level.\n3. Identify snake if possible, but DO NOT approach it.', color: '#e67e22' },
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
          // If first time opening app, save initial data
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

  // Filter Logic
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Education Center</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for symptoms or guides..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'offline' && styles.activeTab]} 
            onPress={() => setActiveTab('offline')}
          >
            <Text style={[styles.tabText, activeTab === 'offline' && styles.activeTabText]}>Offline Help</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'online' && styles.activeTab]} 
            onPress={() => setActiveTab('online')}
          >
            <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>Online Guides</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={activeTab === 'offline' ? filteredOffline : filteredOnline}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'offline' ? renderOfflineItem : renderOnlineItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No guides found for "{searchQuery}"</Text>
        }
      />
      
      {/* Offline Indicator */}
      {activeTab === 'offline' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>✓ Available Offline</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerTitle: { textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#2d3436', marginBottom: 15 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchInput: { backgroundColor: '#f1f2f6', padding: 12, borderRadius: 10, fontSize: 16, color: '#2d3436' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#eee' },
  activeTab: { borderBottomColor: '#3498db' },
  tabText: { fontWeight: 'bold', color: '#b2bec3' },
  activeTabText: { color: '#3498db' },
  listContent: { padding: 20 },
  offlineCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, borderLeftWidth: 6, elevation: 2 },
  onlineCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#2d3436', marginBottom: 5 },
  cardBody: { fontSize: 14, color: '#636e72', lineHeight: 20 },
  sourceText: { fontSize: 12, color: '#3498db', fontWeight: 'bold' },
  arrow: { fontSize: 22, color: '#bdc3c7', marginLeft: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#b2bec3', fontSize: 16 },
  offlineBanner: { backgroundColor: '#2ecc71', padding: 5, alignItems: 'center' },
  offlineBannerText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});

export default EducationCenter;