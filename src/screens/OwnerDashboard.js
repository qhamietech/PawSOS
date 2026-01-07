import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, StatusBar, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { COLORS, GlobalStyles } from '../styles/theme'; 

const { width, height } = Dimensions.get('window');

const OwnerDashboard = ({ navigation, route }) => {
  const userProfile = route.params?.userProfile;
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid) return;
    const q = query(
      collection(db, "alerts"),
      where("ownerId", "==", userProfile.uid),
      where("status", "in", ["pending", "accepted", "on_way"]),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveAlerts(cases);
    });
    return () => unsubscribe();
  }, [userProfile]);

  const handleActiveCasePress = () => {
    if (activeAlerts.length === 0) {
      Alert.alert("No Active Case", "You don't have an ongoing emergency request.");
    } else if (activeAlerts.length === 1) {
      navigation.navigate('LiveCaseScreen', { alertId: activeAlerts[0].id, userProfile });
    } else {
      setShowPicker(true);
    }
  };

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <LinearGradient colors={[COLORS.primaryDark, COLORS.surfaceDark]} style={styles.hero}>
          <SafeAreaView>
            {/* ADDED: Back Button Row */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Exit</Text>
            </TouchableOpacity>

            <View style={styles.headerRow}>
              <View>
                <Text style={styles.welcomeText}>Hello, {userProfile?.name?.split(' ')[0] || 'Friend'} 👋</Text>
                <Text style={styles.heroTitle}>Your pet's safety{"\n"}is our priority.</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileIcon}>
                 <Text style={{fontSize: 22}}>🐶</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* SOS ACTION CENTER */}
        <View style={GlobalStyles.card}>
          <View style={styles.actionInner}>
            {activeAlerts.length > 0 && (
              <View style={styles.activePulse}>
                <Text style={styles.pulseText}>{activeAlerts.length} EMERGENCY{activeAlerts.length > 1 ? 'S' : ''} ACTIVE</Text>
              </View>
            )}
            <TouchableOpacity style={styles.sosCircle} onPress={() => navigation.navigate('SOSForm')} activeOpacity={0.9}>
              <LinearGradient colors={[COLORS.accentCoral, '#E8634D']} style={styles.sosGradient}>
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
              <View style={styles.emojiCircle}><Text style={styles.gridEmoji}>📚</Text></View>
              <Text style={styles.gridLabel}>First Aid</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.gridItem, activeAlerts.length > 0 && styles.activeGridItem]} onPress={handleActiveCasePress}>
              <View style={styles.emojiCircle}>
                <Text style={styles.gridEmoji}>📋</Text>
                {activeAlerts.length > 0 && (
                  <View style={styles.badgeCount}><Text style={styles.badgeText}>{activeAlerts.length}</Text></View>
                )}
              </View>
              <Text style={[styles.gridLabel, activeAlerts.length > 0 && {color: COLORS.accentCoral}]}>Active Cases</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}><View style={styles.emojiCircle}><Text style={styles.gridEmoji}>🏥</Text></View><Text style={styles.gridLabel}>Nearby Vets</Text></TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Leaderboard')}><View style={styles.emojiCircle}><Text style={styles.gridEmoji}>🏆</Text></View><Text style={styles.gridLabel}>Top Heroes</Text></TouchableOpacity>
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
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: height * 0.6}}>
              {activeAlerts.map((item) => (
                <TouchableOpacity key={item.id} style={styles.caseItem} onPress={() => { setShowPicker(false); navigation.navigate('LiveCaseScreen', { alertId: item.id, userProfile }); }}>
                  <View style={styles.caseItemHeader}>
                    <Text style={styles.caseItemStatus}>{item.status.toUpperCase()}</Text>
                    <Text style={styles.caseItemDate}>{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.caseItemSymptoms} numberOfLines={2}>{item.symptoms}</Text>
                  <Text style={styles.viewLink}>View Clipboard →</Text>
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
  hero: { paddingTop: 10, paddingBottom: 60, paddingHorizontal: 25, borderBottomLeftRadius: 45, borderBottomRightRadius: 45 },
  backButton: { marginBottom: 15, alignSelf: 'flex-start', padding: 5 },
  backButtonText: { color: COLORS.accentCoral, fontWeight: 'bold', fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeText: { color: COLORS.accentCoral, fontSize: 14, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { color: COLORS.pureWhite, fontSize: 30, fontWeight: '900', marginTop: 10, lineHeight: 36 },
  profileIcon: { backgroundColor: 'rgba(255,255,255,0.1)', width: 55, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionInner: { marginTop: -10, alignItems: 'center', paddingVertical: 10 },
  activePulse: { backgroundColor: COLORS.accentCoral, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  pulseText: { color: COLORS.pureWhite, fontSize: 10, fontWeight: '900' },
  sosCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.pureWhite, padding: 10, shadowColor: COLORS.accentCoral, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20 },
  sosGradient: { flex: 1, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  sosText: { color: COLORS.pureWhite, fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  sosSubtext: { marginTop: 20, color: COLORS.primaryDark, fontWeight: '800', fontSize: 15, opacity: 0.7 },
  section: { padding: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primaryDark, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { backgroundColor: COLORS.pureWhite, width: (width - 70) / 2, padding: 20, borderRadius: 30, marginBottom: 20, alignItems: 'center', elevation: 2 },
  activeGridItem: { borderColor: COLORS.accentCoral, borderWidth: 2 },
  emojiCircle: { backgroundColor: COLORS.ghostWhite, width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative' },
  gridEmoji: { fontSize: 28 },
  gridLabel: { fontWeight: '800', color: COLORS.primaryDark, fontSize: 14 },
  badgeCount: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.accentCoral, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.pureWhite },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark },
  closeBtn: { fontSize: 24, color: '#888', fontWeight: 'bold' },
  caseItem: { backgroundColor: '#F8F9FB', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  caseItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  caseItemStatus: { color: COLORS.accentCoral, fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  caseItemDate: { color: '#AAA', fontSize: 10 },
  caseItemSymptoms: { fontSize: 15, color: COLORS.primaryDark, fontWeight: '600' },
  viewLink: { marginTop: 10, color: COLORS.primaryDark, fontWeight: 'bold', fontSize: 12 }
});

export default OwnerDashboard;
