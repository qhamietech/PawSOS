import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Alert, 
  StatusBar, SafeAreaView, ActivityIndicator, ScrollView, 
  TextInput, Animated 
} from 'react-native'; 
import { db, auth } from '../../firebaseConfig'; 
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';
import { acceptSOS, logoutUser, registerForPushNotifications, takeOverCase } from '../services/firebaseActions';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * VOLUNTEER DASHBOARD
 * Purpose: Central hub for Responders (Students & Vets).
 * Logic: Implements Tier-Based Access Control (RBAC) where users only see 
 * alerts matching their qualification level.
 */
const VolunteerDashboard = ({ navigation, route }) => {
  const [alerts, setAlerts] = useState([]);
  const [escalatedAlerts, setEscalatedAlerts] = useState([]); 
  const [userProfile, setUserProfile] = useState(route.params?.userProfile || null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(''); 
  
  // LIVE PORTFOLIO STATS
  const [liveStats, setLiveStats] = useState({ resolved: 0, points: 0 });
  
  // CPR METRONOME ANIMATION
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const beatAnim = useRef(new Animated.Value(1)).current;
  const hasLoadedInitial = useRef(false);

  // --- CPR METRONOME LOGIC (110 BPM) ---
  useEffect(() => {
    let interval;
    if (isMetronomeActive) {
      interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(beatAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
          Animated.timing(beatAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      }, 545); // Calculations: 60,000ms / 110bpm = ~545ms
    } else {
      beatAnim.setValue(1);
    }
    return () => clearInterval(interval);
  }, [isMetronomeActive]);

  // --- DATA INITIALIZATION & LISTENERS ---
  useEffect(() => {
    const userId = userProfile?.uid || auth.currentUser?.uid;
    if (!userId) { setLoading(false); return; }

    // 1. Live Profile Listener (Points & Tier)
    const unsubProfile = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({ ...data, uid: userId });
      }
      if (!hasLoadedInitial.current) {
        setLoading(false);
        hasLoadedInitial.current = true;
      }
    });

    // 2. Real-time Impact Statistics
    const statsQuery = query(
      collection(db, "alerts"),
      where("assignedVetId", "==", userId),
      where("status", "==", "resolved")
    );
    const unsubStats = onSnapshot(statsQuery, (snapshot) => {
      const count = snapshot.size;
      setLiveStats({ resolved: count, points: count * 50 });
    });

    // 3. Dynamic Alerts Query (Tier-Based Filtering)
    const userTier = userProfile?.tierId || 'student';
    let allowedSeverities = ['low'];
    if (userTier === 'graduate') allowedSeverities = ['low', 'mid'];
    if (userTier === 'qualified') allowedSeverities = ['low', 'mid', 'high'];

    const q = query(
      collection(db, "alerts"), 
      where("status", "in", ["pending", "on_way", "accepted"]),
      where("severity", "in", allowedSeverities),
      orderBy("createdAt", "desc")
    );

    const unsubscribeAlerts = onSnapshot(q, (snapshot) => {
      const temp = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setAlerts(temp);
    }, (err) => console.error("Alerts Sync Error:", err));

    // 4. Escalation Monitor (Seniors see what students couldn't handle)
    let unsubscribeEscalated = () => {};
    if (userTier !== 'student') {
        const eq = query(
            collection(db, "alerts"),
            where("status", "==", "escalated"),
            orderBy("createdAt", "desc")
        );
        unsubscribeEscalated = onSnapshot(eq, (snapshot) => {
            const temp = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setEscalatedAlerts(temp);
        });
    }

    registerForPushNotifications(userId);
    
    return () => { 
      unsubProfile(); unsubStats();
      unsubscribeAlerts(); unsubscribeEscalated();
    };
  }, [userProfile?.uid, userProfile?.tierId]);

  // --- NAVIGATION & ACTIONS ---
  const handleLogout = () => {
    Alert.alert("Go Offline", "Stop receiving emergency notifications?", [
      { text: "Stay Online", style: "cancel" },
      { text: "Go Offline", style: 'destructive', onPress: async () => {
          await logoutUser();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    ]);
  };

  const handleAcceptOrEnter = async (item) => {
    if (item.assignedVetId === userProfile.uid) {
      navigation.navigate('LiveCaseScreen', { alertId: item.id, userProfile: userProfile });
      return;
    }

    const isEscalated = item.status === 'escalated';
    const isStudent = userProfile?.tierId === 'student';

    Alert.alert(
      isEscalated ? "High Priority: Take Over Case" : (isStudent ? "Provide Guidance" : "Respond to SOS"),
      isEscalated 
        ? "This requires immediate professional intervention."
        : "Confirm you are ready to assist with this case.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: async () => {
            let res = isEscalated 
              ? await takeOverCase(item.id, userProfile.uid, userProfile.name, userProfile.tierId)
              : await acceptSOS(item.id, userProfile.uid, userProfile.name, userProfile.tierId);
            
            if (res.success) navigation.navigate('LiveCaseScreen', { alertId: item.id, userProfile: userProfile });
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={COLORS.accentCoral} size="large" /></View>;

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Hello {userProfile?.name?.split(' ')[0] || 'Volunteer'}</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>SHUTDOWN SYSTEM</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileCircle}>
            <Ionicons name="medical" size={24} color={COLORS.accentCoral} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={[COLORS.primaryDark, '#1a1a2e']} style={styles.rankCard}>
          <View>
            <Text style={styles.rankLabel}>CURRENT LICENSE</Text>
            <Text style={styles.rankTier}>{userProfile?.tierId?.toUpperCase() || 'STUDENT'}</Text>
          </View>
          <View style={styles.pointsContainer}>
              <Text style={styles.pointsValue}>{liveStats.points || userProfile?.points || 0}</Text>
              <Text style={styles.pointsLabel}>RESCUE PTS</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* KPI / IMPACT CARDS */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Global Impact</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
            <View style={[styles.statCard, { borderLeftColor: '#2ecc71' }]}>
              <Text style={styles.statValue}>{liveStats.resolved}</Text>
              <Text style={styles.statLabel}>Lives Saved</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: COLORS.accentCoral }]}>
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: COLORS.accentAmber }]}>
              <Text style={styles.statValue}>~5m</Text>
              <Text style={styles.statLabel}>Response</Text>
            </View>
          </ScrollView>
        </View>

        {/* CLINICAL TOOLS */}
        <View style={styles.toolsGrid}>
          <TouchableOpacity 
            style={[styles.toolCard, isMetronomeActive && styles.toolCardActive]} 
            onPress={() => setIsMetronomeActive(!isMetronomeActive)}
          >
            <Animated.Text style={[styles.toolIcon, { transform: [{ scale: beatAnim }] }]}>
                {isMetronomeActive ? '❤️' : '🫀'}
            </Animated.Text>
            <Text style={[styles.toolTitle, isMetronomeActive && { color: '#fff' }]}>CPR Metronome</Text>
            <Text style={[styles.toolSubText, isMetronomeActive && { color: 'rgba(255,255,255,0.7)' }]}>
                {isMetronomeActive ? '110 BPM ACTIVE' : 'Start Guidance'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolCard} onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.toolIcon}>🏆</Text>
            <Text style={styles.toolTitle}>Leaderboard</Text>
            <Text style={styles.toolSubText}>Top Responders</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH & FILTER */}
        <View style={styles.searchSection}>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search symptoms..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* FIRST AID PROTOCOLS */}
        <View style={styles.guideContainer}>
            <Text style={styles.sectionTitle}>Emergency Protocols</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guideScroll}>
                {protocols.map((p) => (
                    <TouchableOpacity key={p.id} style={styles.guideCard} onPress={() => Alert.alert(p.title, p.guide)}>
                        <View style={[styles.guideIcon, { backgroundColor: p.color }]}>
                            <Text style={{ fontSize: 32 }}>{p.icon}</Text>
                        </View>
                        <Text style={styles.guideCardTitle}>{p.title}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* ALERTS FEED: Escalated (High Priority) */}
        {userProfile?.tierId !== 'student' && escalatedAlerts.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <View style={styles.feedHeaderRow}>
                <Text style={[styles.sectionTitle, { color: COLORS.accentCoral }]}>⚠️ ESCALATED CASES</Text>
            </View>
            <View style={styles.listContainer}>
                {escalatedAlerts.map((item) => (
                  <View key={item.id} style={[GlobalStyles.card, { borderColor: COLORS.accentCoral, borderWidth: 1 }]}>
                    <View style={styles.cardHeader}>
                      <View>
                         <Text style={styles.ownerText}>{item.ownerName}</Text>
                         <Text style={[styles.activeStatusText, { color: COLORS.accentCoral }]}>• PROFESSIONAL TAKEOVER REQ.</Text>
                      </View>
                      <View style={[styles.pill, { backgroundColor: COLORS.accentCoral }]}>
                        <Text style={styles.pillText}>CRITICAL</Text>
                      </View>
                    </View>
                    <Text style={styles.symptomsText} numberOfLines={2}>{item.symptoms}</Text>
                    <TouchableOpacity onPress={() => handleAcceptOrEnter(item)}>
                      <LinearGradient colors={['#FF416C', '#FF4B2B']} style={styles.acceptBtn}>
                        <Text style={GlobalStyles.buttonText}>TAKE OVER NOW</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* ALERTS FEED: Standard */}
        <View style={styles.feedHeaderRow}>
            <Text style={styles.sectionTitle}>Live Emergency Feed</Text>
            <View style={styles.livePulse} />
        </View>

        <View style={styles.listContainer}>
          {alerts.filter(a => a.symptoms?.toLowerCase().includes(searchText.toLowerCase())).length === 0 ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedText}>Scanning for nearby emergencies...</Text>
            </View>
          ) : (
            alerts
              .filter(a => a.symptoms?.toLowerCase().includes(searchText.toLowerCase()))
              .map((item) => {
                const isMyCase = item.assignedVetId === userProfile?.uid;
                return (
                  <View key={item.id} style={[GlobalStyles.card, isMyCase && styles.activeCard]}>
                    <View style={styles.cardHeader}>
                      <View>
                         <Text style={styles.ownerText}>{item.ownerName}</Text>
                         {isMyCase && <Text style={styles.activeStatusText}>• YOU ARE RESPONDING</Text>}
                      </View>
                      <View style={[styles.pill, { backgroundColor: item.severity === 'high' ? COLORS.accentCoral : COLORS.accentAmber }]}>
                        <Text style={styles.pillText}>{item.severity?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.symptomsText} numberOfLines={2}>{item.symptoms}</Text>
                    <TouchableOpacity onPress={() => handleAcceptOrEnter(item)}>
                      <LinearGradient 
                        colors={isMyCase ? [COLORS.accentCoral, '#E8634D'] : [COLORS.primaryDark, '#2c2c44']} 
                        style={styles.acceptBtn}
                      >
                        <Text style={GlobalStyles.buttonText}>
                            {isMyCase ? "OPEN MEDICAL CLIPBOARD" : (userProfile?.tierId === 'student' ? "CONSULT" : "RESPOND")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                );
              })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const protocols = [
    { id: '1', title: 'CPR', icon: '🫀', color: '#FF6B6B', guide: '30 compressions : 2 breaths. Rate of 100-120 BPM.' },
    { id: '2', title: 'CHOKING', icon: '🥩', color: '#4ECDC4', guide: 'Check mouth for obstruction. Perform abdominal thrusts.' },
    { id: '3', title: 'BLEEDING', icon: '🩸', color: '#FFB86C', guide: 'Apply direct pressure with clean cloth. Elevate wound.' },
    { id: '4', title: 'HEATSTROKE', icon: '☀️', color: '#A29BFE', guide: 'Move to shade. Use cool (not cold) water on fur.' },
];

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.ghostWhite },
  header: { backgroundColor: COLORS.pureWhite, paddingHorizontal: 25, paddingBottom: 25, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 5 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  welcomeText: { fontSize: 26, fontWeight: '900', color: COLORS.primaryDark },
  logoutText: { color: COLORS.accentCoral, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  profileCircle: { backgroundColor: COLORS.ghostWhite, width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  rankCard: { padding: 20, borderRadius: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankLabel: { color: COLORS.accentCoral, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  rankTier: { color: COLORS.pureWhite, fontSize: 22, fontWeight: '900' },
  pointsContainer: { alignItems: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 20 },
  pointsValue: { color: COLORS.pureWhite, fontSize: 24, fontWeight: '900' },
  pointsLabel: { color: COLORS.accentCoral, fontSize: 10, fontWeight: '800' },
  statsSection: { marginTop: 25 },
  statsScroll: { paddingLeft: 25, paddingRight: 10 },
  statCard: { backgroundColor: '#fff', width: 120, padding: 15, borderRadius: 20, marginRight: 12, elevation: 3, borderLeftWidth: 4 },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark },
  statLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginTop: 2 },
  toolsGrid: { flexDirection: 'row', paddingHorizontal: 25, marginTop: 20, justifyContent: 'space-between' },
  toolCard: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 25, alignItems: 'center', elevation: 3 },
  toolCardActive: { backgroundColor: COLORS.primaryDark },
  toolIcon: { fontSize: 30, marginBottom: 10 },
  toolTitle: { fontSize: 14, fontWeight: '900', color: COLORS.primaryDark },
  toolSubText: { fontSize: 10, color: '#888', marginTop: 4 },
  searchSection: { paddingHorizontal: 25, marginTop: 25 },
  searchInput: { backgroundColor: '#F0F0F0', padding: 15, borderRadius: 15, fontSize: 16, color: COLORS.primaryDark },
  guideContainer: { marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryDark, marginLeft: 25, marginBottom: 12 },
  guideScroll: { paddingLeft: 25, paddingRight: 25 },
  guideCard: { marginRight: 22, alignItems: 'center' },
  guideIcon: { width: 85, height: 85, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  guideCardTitle: { marginTop: 10, fontSize: 12, fontWeight: '900', color: COLORS.primaryDark },
  feedHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71', marginLeft: 10, marginBottom: 12 },
  emptyFeed: { padding: 40, alignItems: 'center' },
  emptyFeedText: { color: '#aaa', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  listContainer: { paddingHorizontal: 25, paddingBottom: 40 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  activeCard: { borderColor: COLORS.accentCoral, borderWidth: 2 },
  activeStatusText: { color: COLORS.accentCoral, fontSize: 10, fontWeight: '900', marginTop: 2 },
  ownerText: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  pillText: { fontSize: 10, fontWeight: '900', color: COLORS.pureWhite },
  symptomsText: { color: COLORS.grayText, fontSize: 14, marginBottom: 20 },
  acceptBtn: { height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});

export default VolunteerDashboard;