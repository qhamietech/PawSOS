import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, StatusBar, Alert, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebaseConfig'; 
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { COLORS, GlobalStyles } from '../styles/theme'; 

const { width, height } = Dimensions.get('window');

const OwnerDashboard = ({ navigation, route }) => {
  const [userProfile, setUserProfile] = useState(route.params?.userProfile || null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(!userProfile);

  useEffect(() => {
    let uid = userProfile?.uid || auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubProfile = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        setUserProfile({ ...snap.data(), uid });
      }
      setLoading(false);
    });

    const q = query(
      collection(db, "alerts"),
      where("ownerId", "==", uid),
      where("status", "in", ["pending", "accepted", "on_way"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribeAlerts = onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveAlerts(cases);
    });

    return () => {
      unsubProfile();
      unsubscribeAlerts();
    };
  }, []);

  // --- LOGOUT WITH CONFIRMATION ---
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: () => {
            auth.signOut().then(() => {
              navigation.replace('Login');
            });
          } 
        }
      ]
    );
  };

  const handleActiveCasePress = () => {
    if (activeAlerts.length === 0) {
      Alert.alert("No Active Case", "Everything looks clear!");
    } else if (activeAlerts.length === 1) {
      navigation.navigate('LiveCaseScreen', { alertId: activeAlerts[0].id, userProfile });
    } else {
      setShowPicker(true);
    }
  };

  if (loading) {
    return (
      <View style={[GlobalStyles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accentCoral || "#FF6B6B"} />
      </View>
    );
  }

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <LinearGradient colors={[COLORS.primaryDark || '#1A1A1A', COLORS.surfaceDark || '#333333']} style={styles.hero}>
          <SafeAreaView>
            <View style={styles.topActionRow}>
                <View /> 
                <TouchableOpacity onPress={handleLogout}>
                  <View style={styles.logoutContent}>
                    <Text style={styles.logoutText}>Logout 🚪</Text>
                  </View>
                </TouchableOpacity>
            </View>

            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeText}>Hello, {userProfile?.name?.split(' ')[0] || 'Friend'} 👋</Text>
                <Text style={styles.heroTitle}>Your pet's safety is our priority.</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileIcon}>
                 <Text style={{fontSize: 28}}>👤</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* SOS ACTION CENTER */}
        <View style={[GlobalStyles.card, {marginTop: -30, marginHorizontal: 25, elevation: 10}]}>
          <View style={styles.actionInner}>
            {activeAlerts.length > 0 && (
              <View style={styles.activePulse}>
                <Text style={styles.pulseText}>{activeAlerts.length} EMERGENCY ACTIVE 🚨</Text>
              </View>
            )}
            <TouchableOpacity 
                style={styles.sosCircle} 
                onPress={() => navigation.navigate('SOSForm')} 
                activeOpacity={0.9}
            >
              <LinearGradient colors={[COLORS.accentCoral || '#FF6B6B', '#E8634D']} style={styles.sosGradient}>
                <Text style={{fontSize: 45, marginBottom: 5}}>📢</Text>
                <Text style={styles.sosText}>SOS</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.sosSubtext}>Tap in case of emergency</Text>
          </View>
        </View>

        {/* QUICK ACTIONS GRID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Toolkit</Text>
          <View style={styles.grid}>
            
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('EducationCenter')}>
              <View style={styles.emojiCircle}>
                <Text style={styles.gridEmoji}>💊</Text>
              </View>
              <Text style={styles.gridLabel}>First Aid</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.gridItem, activeAlerts.length > 0 && styles.activeGridItem]} 
                onPress={handleActiveCasePress}
            >
              <View style={styles.emojiCircle}>
                <Text style={styles.gridEmoji}>📋</Text>
                {activeAlerts.length > 0 && (
                  <View style={styles.badgeCount}><Text style={styles.badgeText}>{activeAlerts.length}</Text></View>
                )}
              </View>
              <Text style={[styles.gridLabel, activeAlerts.length > 0 && {color: COLORS.accentCoral || "#FF6B6B"}]}>Active Cases</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('NearbyVets')}>
              <View style={styles.emojiCircle}>
                <Text style={styles.gridEmoji}>📍</Text>
              </View>
              <Text style={styles.gridLabel}>Nearby Vets</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Leaderboard')}>
              <View style={styles.emojiCircle}>
                <Text style={styles.gridEmoji}>🏆</Text>
              </View>
              <Text style={styles.gridLabel}>Top Heroes</Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>

      {/* MULTIPLE CASE MODAL */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Active Emergencies</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={{fontSize: 24}}>❌</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: height * 0.6}} showsVerticalScrollIndicator={false}>
              {activeAlerts.map((item) => (
                <TouchableOpacity 
                    key={item.id} 
                    style={styles.caseItem} 
                    onPress={() => { 
                        setShowPicker(false); 
                        navigation.navigate('LiveCaseScreen', { alertId: item.id, userProfile }); 
                    }}
                >
                  <View style={styles.caseItemHeader}>
                    <Text style={styles.caseItemStatus}>🚨 {item.status?.toUpperCase()}</Text>
                    <Text style={{fontSize: 18}}>➡️</Text>
                  </View>
                  <Text style={styles.caseItemSymptoms}>{item.symptoms}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: { paddingTop: 20, paddingBottom: 60, paddingHorizontal: 25, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  topActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  logoutContent: { flexDirection: 'row', alignItems: 'center' },
  logoutText: { color: '#AAAAAA', fontWeight: 'bold', fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  heroTitle: { color: COLORS.accentCoral || '#FF6B6B', fontSize: 16, fontWeight: '700', marginTop: 4, opacity: 0.9 },
  profileIcon: { backgroundColor: 'rgba(255,255,255,0.1)', width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionInner: { alignItems: 'center', paddingVertical: 10 },
  activePulse: { backgroundColor: COLORS.accentCoral || '#FF6B6B', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 15 },
  pulseText: { color: 'white', fontSize: 10, fontWeight: '900' },
  sosCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'white', padding: 10, shadowColor: COLORS.accentCoral || '#FF6B6B', shadowOpacity: 0.4, shadowRadius: 15, elevation: 15 },
  sosGradient: { flex: 1, borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
  sosText: { color: 'white', fontSize: 32, fontWeight: '900' },
  sosSubtext: { marginTop: 15, color: COLORS.primaryDark || '#1A1A1A', fontWeight: '800', fontSize: 14, opacity: 0.6 },
  section: { padding: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primaryDark || '#1A1A1A', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { backgroundColor: 'white', width: (width - 70) / 2, padding: 20, borderRadius: 25, marginBottom: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  activeGridItem: { borderColor: COLORS.accentCoral || '#FF6B6B', borderWidth: 2 },
  emojiCircle: { backgroundColor: '#F8F9FB', width: 65, height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridEmoji: { fontSize: 30 },
  gridLabel: { fontWeight: '800', color: COLORS.primaryDark || '#1A1A1A', fontSize: 13 },
  badgeCount: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.accentCoral || '#FF6B6B', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark || '#1A1A1A' },
  caseItem: { backgroundColor: '#F8F9FB', padding: 15, borderRadius: 15, marginBottom: 15 },
  caseItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseItemStatus: { color: COLORS.accentCoral || '#FF6B6B', fontWeight: '900', fontSize: 12 },
  caseItemSymptoms: { fontSize: 14, color: '#333', marginTop: 5 }
});

export default OwnerDashboard;
