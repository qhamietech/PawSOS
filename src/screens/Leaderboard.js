import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GlobalStyles } from '../styles/theme';

const { width } = Dimensions.get('window');

const Leaderboard = ({ navigation }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetching top 20 volunteers based on points
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
          <View style={styles.statsRow}>
            <View style={styles.tierTag}>
              <Text style={styles.tierTagText}>{item.tierId?.toUpperCase() || 'VOLUNTEER'}</Text>
            </View>
            <Text style={styles.livesHelpedText}>• {item.resolvedCount || 0} Lives Helped</Text>
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
      <View style={[GlobalStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primaryDark || "#1A1A1A"} />
      </View>
    );
  }

  // Slice top 3 for the visual podium
  const topThree = leaders.slice(0, 3);
  // Reorder to [Silver, Gold, Bronze] for classic podium look
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HERO HEADER SECTION */}
      <LinearGradient colors={[COLORS.primaryDark || '#1A1A1A', '#1a1a2e']} style={styles.hero}>
        <SafeAreaView>
          <View style={styles.topRow}>
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerLabel}>COMMUNITY RANKINGS</Text>
            <View style={{width: 40}} />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.welcomeText}>Top Heroes 🏆</Text>
            <Text style={styles.heroTitle}>The community's most{"\n"}active responders.</Text>
          </View>
            
          <View style={styles.podiumWrapper}>
            {podiumOrder.map((user, index) => {
              const isGold = user.id === topThree[0]?.id;
              return (
                <View key={user.id} style={styles.podiumMember}>
                  <View style={[styles.podiumCircle, isGold && styles.goldCircle]}>
                     <Text style={[styles.podiumEmoji, isGold && {fontSize: 32}]}>
                       {user.id === topThree[0]?.id ? "👑" : user.id === topThree[1]?.id ? "🥈" : "🥉"}
                     </Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.podiumName, isGold && {fontWeight: '900'}]}>
                    {user.name.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumPoints}>{user.points} pts</Text>
                </View>
              );
            })}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={leaders}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Active Standings</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No rankings yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    color: COLORS.accentCoral || '#FF6B6B', 
    fontSize: 14, 
    fontWeight: '700', 
    marginTop: 4 
  },
  
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
  podiumPoints: { color: COLORS.accentCoral || '#FF6B6B', fontSize: 10, fontWeight: '800' },

  listContent: { padding: 25, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginBottom: 20 },
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
  rankText: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
  
  infoContainer: { flex: 1, marginLeft: 12 },
  nameText: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
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
    backgroundColor: COLORS.primaryDark || '#1A1A1A', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    alignItems: 'center',
    minWidth: 55
  },
  pointsText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  ptsLabel: { color: COLORS.accentCoral || '#FF6B6B', fontSize: 7, fontWeight: '900' },
  
  emptyText: { textAlign: 'center', marginTop: 50, color: '#95a5a6', fontWeight: '600' }
});

export default Leaderboard;