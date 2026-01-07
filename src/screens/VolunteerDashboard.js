import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking, Platform, StatusBar, SafeAreaView, ActivityIndicator, ScrollView, TextInput, Animated } from 'react-native'; 
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';
import { acceptSOS, logoutUser, registerForPushNotifications } from '../services/firebaseActions';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme';

const VolunteerDashboard = ({ navigation, route }) => {
  const [alerts, setAlerts] = useState([]);
  const [userProfile, setUserProfile] = useState(route.params?.userProfile);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(''); 
  
  // New States for UI Enhancements
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const beatAnim = useRef(new Animated.Value(1)).current;

  const hasLoadedInitial = useRef(false);

  // CPR Metronome Logic (110 BPM)
  useEffect(() => {
    let interval;
    if (isMetronomeActive) {
      interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(beatAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
          Animated.timing(beatAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      }, 545); // Roughly 110 BPM
    } else {
      beatAnim.setValue(1);
    }
    return () => clearInterval(interval);
  }, [isMetronomeActive]);

  useEffect(() => {
    if (route.params?.resolvedCase) {
      Alert.alert(
        "🎉 Case Resolved!",
        "Excellent work! Your points have been updated and the emergency has been closed.",
        [{ text: "Awesome", onPress: () => navigation.setParams({ resolvedCase: undefined }) }]
      );
    }
  }, [route.params?.resolvedCase]);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const unsubProfile = onSnapshot(doc(db, 'users', userProfile.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(prev => {
          if (prev?.points === data.points && prev?.tier === data.tier) return prev;
          return { ...data, uid: userProfile.uid };
        });
      }
      if (!hasLoadedInitial.current) {
        setLoading(false);
        hasLoadedInitial.current = true;
      }
    });

    const userTier = userProfile?.tier || 'volunteer';
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
    });

    if (userProfile?.uid) {
      registerForPushNotifications(userProfile.uid);
    }
    
    return () => { 
      unsubProfile(); 
      unsubscribeAlerts(); 
    };
  }, [userProfile?.uid, userProfile?.tier]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: async () => {
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

    Alert.alert(
      "Accept Case",
      "Are you sure you want to respond to this emergency?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Respond", 
          onPress: async () => {
            const res = await acceptSOS(item.id, userProfile.uid, userProfile.name, userProfile.tier);
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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Hello, {userProfile?.name?.split(' ')[0] || 'Volunteer'}</Text>
            <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>GO OFFLINE</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileCircle}><Text style={{ fontSize: 20 }}>👤</Text></TouchableOpacity>
        </View>

        <LinearGradient colors={[COLORS.primaryDark, '#1a1a2e']} style={styles.rankCard}>
          <View>
            <Text style={styles.rankLabel}>CURRENT RANK</Text>
            <Text style={styles.rankTier}>{userProfile?.tier?.toUpperCase() || 'VOLUNTEER'}</Text>
          </View>
          <View style={styles.pointsContainer}>
             <Text style={styles.pointsValue}>{userProfile?.points || 0}</Text>
             <Text style={styles.pointsLabel}>PTS</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* IMPACT STATS SECTION */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
            <View style={[styles.statCard, { borderLeftColor: '#2ecc71' }]}>
              <Text style={styles.statValue}>{Math.floor((userProfile?.points || 0) / 50)}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: COLORS.accentCoral }]}>
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: COLORS.accentAmber }]}>
              <Text style={styles.statValue}>~9m</Text>
              <Text style={styles.statLabel}>Response</Text>
            </View>
          </ScrollView>
        </View>

        {/* TOOLS GRID SECTION */}
        <View style={styles.toolsGrid}>
          <TouchableOpacity 
            style={[styles.toolCard, isMetronomeActive && styles.toolCardActive]} 
            onPress={() => setIsMetronomeActive(!isMetronomeActive)}
          >
            <Animated.Text style={[styles.toolIcon, { transform: [{ scale: beatAnim }] }]}>❤️</Animated.Text>
            <Text style={[styles.toolTitle, isMetronomeActive && { color: '#fff' }]}>CPR Pace</Text>
            <Text style={[styles.toolSubText, isMetronomeActive && { color: 'rgba(255,255,255,0.7)' }]}>
               {isMetronomeActive ? '110 BPM' : 'Start Metronome'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bulletinCard}>
            <Text style={styles.bulletinHeader}>Community Notes</Text>
            <Text style={styles.bulletinText}>• Heat warning in South District.</Text>
            <Text style={styles.bulletinText}>• City Vet is now 24/7 partner.</Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search alerts..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.guideContainer}>
            <Text style={styles.sectionTitle}>First Aid Guide</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guideScroll}>
                {protocols.map((p) => (
                    <TouchableOpacity key={p.id} style={styles.guideCard} onPress={() => Alert.alert(p.title, p.guide)}>
                        <View style={[styles.guideIcon, { backgroundColor: p.color }]}>
                            <Text style={{ fontSize: 24 }}>{p.icon}</Text>
                        </View>
                        <Text style={styles.guideCardTitle}>{p.title}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        <View style={styles.feedHeaderRow}>
            <Text style={styles.sectionTitle}>Emergency Feed</Text>
            <View style={styles.livePulse} />
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Text style={styles.emptyFeedText}>No emergencies in your area. Stay alert!</Text>
          </View>
        ) : (
          <FlatList
            data={alerts.filter(a => (a.symptoms || "").toLowerCase().includes(searchText.toLowerCase()))}
            scrollEnabled={false} 
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const isMyCase = item.assignedVetId === userProfile.uid;
              return (
                <View style={[GlobalStyles.card, isMyCase && styles.activeCard]}>
                  <View style={styles.cardHeader}>
                    <View>
                       <Text style={styles.ownerText}>{item.ownerName}'s Pet</Text>
                       {isMyCase && <Text style={styles.activeStatusText}>• ACTIVE CASE</Text>}
                    </View>
                    <View style={[styles.pill, { backgroundColor: item.severity === 'high' ? COLORS.accentCoral : COLORS.accentAmber }]}>
                      <Text style={styles.pillText}>{item.severity?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.symptomsText} numberOfLines={2}>{item.symptoms}</Text>
                  <TouchableOpacity onPress={() => handleAcceptOrEnter(item)}>
                    <LinearGradient colors={isMyCase ? [COLORS.accentCoral, '#E8634D'] : [COLORS.primaryDark, COLORS.surfaceDark]} style={styles.acceptBtn}>
                      <Text style={GlobalStyles.buttonText}>{isMyCase ? "OPEN CLIPBOARD" : "RESPOND NOW"}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
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
  
  // Stats & Tools
  statsSection: { marginTop: 25 },
  statsScroll: { paddingLeft: 25, paddingRight: 10 },
  statCard: { backgroundColor: '#fff', width: 110, padding: 15, borderRadius: 20, marginRight: 12, elevation: 3, borderLeftWidth: 4 },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark },
  statLabel: { fontSize: 10, color: '#888', fontWeight: 'bold', marginTop: 2 },
  
  toolsGrid: { flexDirection: 'row', paddingHorizontal: 25, marginTop: 20, justifyContent: 'space-between' },
  toolCard: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 25, alignItems: 'center', elevation: 3 },
  toolCardActive: { backgroundColor: COLORS.primaryDark },
  toolIcon: { fontSize: 30, marginBottom: 10 },
  toolTitle: { fontSize: 14, fontWeight: '900', color: COLORS.primaryDark },
  toolSubText: { fontSize: 10, color: '#888', marginTop: 4 },
  bulletinCard: { width: '48%', backgroundColor: '#EBF5FF', padding: 15, borderRadius: 25, borderWidth: 1, borderColor: '#3498DB', borderStyle: 'dashed' },
  bulletinHeader: { fontSize: 12, fontWeight: '900', color: '#2980B9', marginBottom: 8 },
  bulletinText: { fontSize: 10, color: '#34495E', marginBottom: 4, lineHeight: 14 },

  searchSection: { paddingHorizontal: 25, marginTop: 25 },
  searchInput: { backgroundColor: '#F0F0F0', padding: 15, borderRadius: 15, fontSize: 16 },
  guideContainer: { marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryDark, marginLeft: 25, marginBottom: 12 },
  guideScroll: { paddingLeft: 25, paddingRight: 10 },
  guideCard: { marginRight: 15, alignItems: 'center' },
  guideIcon: { width: 65, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  guideCardTitle: { marginTop: 8, fontSize: 10, fontWeight: '900', color: COLORS.primaryDark },
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
  pillText: { fontSize: 10, fontWeight: '900', color: COLORS.primaryDark },
  symptomsText: { color: COLORS.grayText, fontSize: 14, marginBottom: 20 },
  acceptBtn: { height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});

export default VolunteerDashboard;