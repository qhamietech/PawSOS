import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, Dimensions, 
  SafeAreaView, StatusBar, Alert, Modal, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebaseConfig'; 
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';

// THEME & STYLES
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { styles } from '../styles/OwnerDashboardStyles';

const { height } = Dimensions.get('window');

/**
 * OWNER DASHBOARD
 * Main hub for pet owners to trigger SOS alerts and manage active emergencies.
 * Demonstrates: Real-time Firestore listeners, Modal management, and Logout flows.
 */
const OwnerDashboard = ({ navigation, route }) => {
  const [userProfile, setUserProfile] = useState(route.params?.userProfile || null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(!userProfile);

  // 1. REAL-TIME DATA SUBSCRIPTION
  useEffect(() => {
    let uid = userProfile?.uid || auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    // Listener A: Sync User Profile data
    const unsubProfile = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        setUserProfile({ ...snap.data(), uid });
      }
      setLoading(false);
    });

    // Listener B: Sync Active SOS Cases for this owner
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

    // Clean up listeners on unmount
    return () => {
      unsubProfile();
      unsubscribeAlerts();
    };
  }, []);

  // 2. LOGOUT LOGIC
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out of PawSOS?",
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

  // 3. CASE NAVIGATION LOGIC
  const handleActiveCasePress = () => {
    if (activeAlerts.length === 0) {
      Alert.alert("All Clear", "You have no active emergency cases.");
    } else if (activeAlerts.length === 1) {
      navigation.navigate('LiveCaseScreen', { alertId: activeAlerts[0].id, userProfile });
    } else {
      setShowPicker(true); // Open modal if there are multiple active cases
    }
  };

  if (loading) {
    return (
      <View style={[GlobalStyles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accentCoral} />
      </View>
    );
  }

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <LinearGradient colors={[COLORS.primaryDark, '#2c2c44']} style={styles.hero}>
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
              <LinearGradient colors={[COLORS.accentCoral, '#E8634D']} style={styles.sosGradient}>
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
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeText}>{activeAlerts.length}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.gridLabel, activeAlerts.length > 0 && {color: COLORS.accentCoral}]}>
                Active Cases
              </Text>
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

      {/* MULTIPLE CASE MODAL - Handles edge case of multiple active alerts */}
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
                  <Text style={styles.caseItemSymptoms} numberOfLines={1}>{item.symptoms}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OwnerDashboard;
