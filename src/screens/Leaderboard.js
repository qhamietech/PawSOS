import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, StatusBar, 
  SafeAreaView, TouchableOpacity 
} from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// THEME & STYLES
import { COLORS, GlobalStyles } from '../styles/theme';
import { styles } from '../styles/LeaderboardStyles';

/**
 * LEADERBOARD SCREEN
 * Visualizes community contributions through a points-based ranking system.
 * Features: Podium visualizer for Top 3, Real-time score syncing, and rank badges.
 */
const Leaderboard = ({ navigation }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. DATA SUBSCRIPTION: Real-time top 20 volunteers
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

  // 2. RENDER HELPERS
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
        <ActivityIndicator size="large" color={COLORS.primaryDark} />
      </View>
    );
  }

  // PODIUM LOGIC: Reorder top 3 to [Silver, Gold, Bronze] for classic podium display
  const topThree = leaders.slice(0, 3);
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HERO HEADER SECTION */}
      <LinearGradient colors={[COLORS.primaryDark, '#1a1a2e']} style={styles.hero}>
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
            
          {/* PODIUM DISPLAY */}
          <View style={styles.podiumWrapper}>
            {podiumOrder.map((user) => {
              const isGold = user.id === topThree[0]?.id;
              const isSilver = user.id === topThree[1]?.id;
              return (
                <View key={user.id} style={styles.podiumMember}>
                  <View style={[styles.podiumCircle, isGold && styles.goldCircle]}>
                     <Text style={[styles.podiumEmoji, isGold && {fontSize: 32}]}>
                       {isGold ? "👑" : isSilver ? "🥈" : "🥉"}
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

      {/* STANDINGS LIST */}
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

export default Leaderboard;