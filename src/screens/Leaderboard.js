import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar, SafeAreaView, Dimensions } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "volunteer"),
      orderBy("points", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tempLeaders = [];
      snapshot.forEach((doc) => {
        tempLeaders.push({ id: doc.id, ...doc.data() });
      });
      setLeaders(tempLeaders);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderLeaderItem = ({ item, index }) => {
    const isTopThree = index < 3;
    const medals = ["🥇", "🥈", "🥉"];

    return (
      <View style={styles.leaderCard}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{isTopThree ? medals[index] : index + 1}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{item.name}</Text>
          <View style={styles.tierTag}>
            <Text style={styles.tierTagText}>{item.tier?.toUpperCase() || 'VOLUNTEER'}</Text>
          </View>
        </View>

        <View style={styles.pointsPill}>
          <Text style={styles.pointsText}>{item.points || 0}</Text>
          <Text style={styles.ptsLabel}>PTS</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER SECTION - Inspired by the Dark Profile View */}
      <View style={styles.headerCard}>
        <LinearGradient colors={['#1A1A1A', '#000000']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Text style={styles.headerSubtitle}>COMMUNITY HEROES</Text>
            <Text style={styles.headerTitle}>Top Rescuers</Text>
            
            {/* Top 3 Circular Preview Style */}
            <View style={styles.podiumContainer}>
              {leaders.slice(0, 3).map((l, i) => (
                <View key={l.id} style={[styles.podiumCircle, i === 0 && styles.firstPlace]}>
                   <Text style={styles.podiumEmoji}>{i === 0 ? "👑" : "🐾"}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>

      <FlatList
        data={leaders}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No rankings yet.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#A8E6CF' }, // Mint background
  centered: { justifyContent: 'center', alignItems: 'center' },
  
  headerCard: {
    margin: 20,
    borderRadius: 40,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  headerGradient: { padding: 30, alignItems: 'center' },
  headerSubtitle: { color: '#A8E6CF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 5 },
  
  podiumContainer: { flexDirection: 'row', marginTop: 20, alignItems: 'flex-end' },
  podiumCircle: { 
    width: 50, height: 50, borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    marginHorizontal: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  firstPlace: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff' },
  podiumEmoji: { fontSize: 20 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  leaderCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  rankBadge: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  
  infoContainer: { flex: 1, marginLeft: 10 },
  nameText: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  tierTag: { 
    backgroundColor: '#f1f2f6', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginTop: 4 
  },
  tierTagText: { fontSize: 9, fontWeight: '900', color: '#95a5a6' },

  pointsPill: { 
    backgroundColor: '#1A1A1A', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  pointsText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  ptsLabel: { color: '#A8E6CF', fontSize: 8, fontWeight: '900' },
  
  emptyText: { textAlign: 'center', marginTop: 50, color: '#1A1A1A', fontWeight: '600' }
});

export default Leaderboard;