import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, SafeAreaView, StatusBar, 
  Modal, TextInput, Dimensions 
} from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { 
  doc, onSnapshot, collection, query, where, 
  getDocs, deleteDoc, updateDoc, writeBatch 
} from 'firebase/firestore';
import { 
  updateEmail, updatePassword, deleteUser, 
  reauthenticateWithCredential, EmailAuthProvider 
} from 'firebase/auth';

// THEME & ASSETS
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * PROFILE SCREEN
 * Purpose: User account management, achievement tracking, and rescue history.
 * Highlights: Re-authentication flow, dynamic badge system, and folder-based history.
 */
const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolder, setExpandedFolder] = useState(null);
  const [viewMode, setViewMode] = useState('active'); // 'active', 'archived', 'trash'

  // Account Settings States
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Re-authentication States (Security Guard)
  const [reauthVisible, setReauthVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null); 

  // --- BADGE LOGIC CONFIG ---
  const badgeThresholds = [
    { id: 'b1', level: 1, emoji: '🥉', label: 'Rookie', color: '#cd7f32' },
    { id: 'b2', level: 5, emoji: '🥈', label: 'Guardian', color: '#C0C0C0' },
    { id: 'b3', level: 10, emoji: '🥇', label: 'Elite', color: '#FFD700' },
    { id: 'b4', level: 25, emoji: '💎', label: 'Legend', color: '#b9f2ff' },
  ];

  // 1. SYNC USER PROFILE
  useEffect(() => {
    if (!user) return;
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setNewName(data.name || '');
        setNewEmail(user.email || '');
      }
    });
    return () => unsubProfile();
  }, [user]);

  // 2. SYNC RESCUE HISTORY
  useEffect(() => {
    if (!profile) return;
    const loadData = async () => {
      try {
        // Filter based on role (Owners see their pets, Vets see their cases)
        const filterField = profile.role === 'owner' ? "ownerId" : "assignedVetId";
        const q = query(collection(db, "alerts"), where(filterField, "==", user.uid));
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort by newest first
        setHistory(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch (err) {
        console.error("History Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [profile]);

  // --- DYNAMIC CALCULATIONS ---
  const resolvedCount = history.filter(h => h.status === 'resolved' && !h.isDeleted).length;
  const unlockedBadges = badgeThresholds.filter(b => resolvedCount >= b.level);

  // --- SECURITY: RE-AUTHENTICATION ---
  // Vital for GitHub: Shows you understand Firebase Security requirements for sensitive ops
  const handleReauthAndExecute = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Enter current password to verify identity.");
      return;
    }
    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      setReauthVisible(false);
      setCurrentPassword('');

      if (pendingAction === 'update') await executeProfileUpdate();
      else if (pendingAction === 'delete') await executeAccountDeletion();
      
    } catch (e) {
      Alert.alert("Verification Failed", "Incorrect password.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    // Re-auth is only needed if changing Email or Password
    if (newEmail !== user.email || newPassword.length > 0) {
      setPendingAction('update');
      setReauthVisible(true);
    } else {
      executeProfileUpdate();
    }
  };

  const executeProfileUpdate = async () => {
    try {
      setLoading(true);
      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), { name: newName });
      
      // Update Auth Email
      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
        await updateDoc(doc(db, "users", user.uid), { email: newEmail });
      }
      
      // Update Auth Password
      if (newPassword.length > 0) {
        if (newPassword.length < 6) throw new Error("Password too short.");
        await updatePassword(user, newPassword);
      }

      Alert.alert("Success", "Profile Synced.");
      setSettingsVisible(false);
      setNewPassword('');
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const executeAccountDeletion = async () => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      // Anonymize alerts so data stats remain but PII is gone
      history.forEach(item => {
        const alertRef = doc(db, "alerts", item.id);
        batch.update(alertRef, { 
          ownerId: "DELETED_USER", 
          ownerName: "Former Member",
          ownerPhone: null,
          isArchived: true 
        });
      });

      batch.delete(doc(db, "users", user.uid));
      await batch.commit();
      await deleteUser(user);
      
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      Alert.alert("Error", "Account deletion failed. Try logging in again.");
    } finally {
      setLoading(false);
    }
  };

  // --- HISTORY MANAGEMENT ---
  const filteredHistory = history.filter(item => {
    if (viewMode === 'trash') return item.isDeleted === true;
    if (viewMode === 'archived') return item.isArchived === true && !item.isDeleted;
    return !item.isArchived && !item.isDeleted;
  });

  // Grouping logic for clean UI
  const groupedHistory = filteredHistory.reduce((groups, alert) => {
    const groupName = profile?.role === 'volunteer' 
      ? (alert.ownerName || "Unknown Owner") 
      : (alert.assignedVetName || "Pending Rescue");
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(alert);
    return groups;
  }, {});

  const handleArchiveToggle = async (alertId, isCurrentlyArchived) => {
    await updateDoc(doc(db, "alerts", alertId), { isArchived: !isCurrentlyArchived });
    setHistory(prev => prev.map(h => h.id === alertId ? { ...h, isArchived: !isCurrentlyArchived } : h));
  };

  const moveToTrash = (alertId) => {
    Alert.alert("Move to Trash?", "You can restore this later.", [
      { text: "Cancel" },
      { text: "Trash", onPress: async () => {
        await updateDoc(doc(db, "alerts", alertId), { isDeleted: true, deletedAt: new Date() });
        setHistory(prev => prev.map(h => h.id === alertId ? { ...h, isDeleted: true } : h));
      }}
    ]);
  };

  const emptyTrash = () => {
    const trashItems = history.filter(h => h.isDeleted);
    Alert.alert("Empty Trash?", "This is permanent.", [
      { text: "Cancel" },
      { text: "Empty All", style: 'destructive', onPress: async () => {
        setLoading(true);
        const batch = writeBatch(db);
        trashItems.forEach(item => batch.delete(doc(db, "alerts", item.id)));
        await batch.commit();
        setHistory(prev => prev.filter(h => !h.isDeleted));
        setLoading(false);
      }}
    ]);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.accentCoral} /></View>;

  return (
    <SafeAreaView style={[GlobalStyles.container, { backgroundColor: '#F8F9FA' }]}>
      <StatusBar barStyle="dark-content" />
      
      <Ionicons name="paw" size={80} color="#E8E8E8" style={[styles.bgPaw, {top: 100, left: -20, transform: [{rotate: '15deg'}]}]} />

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={COLORS.primaryDark} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={24} color={COLORS.primaryDark} />
          </TouchableOpacity>

          <LinearGradient colors={[COLORS.primaryDark, COLORS.surfaceDark]} style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{profile?.name?.charAt(0)}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{profile?.name}</Text>
          <Text style={styles.roleLabel}>
            {profile?.role?.toUpperCase()} {profile?.tierId && `• ${profile.tierId.toUpperCase()}`}
          </Text>
        </View>

        {/* QUICK STATS */}
        <View style={styles.statsRow}>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>
              {profile?.role === 'volunteer' ? (profile?.points || 0) : (history.filter(h => !h.isDeleted).length)}
            </Text>
            <Text style={styles.statLabel}>{profile?.role === 'volunteer' ? "EXP" : "ALERTS"}</Text>
          </View>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
        </View>

        {/* TROPHY ROOM */}
        <View style={styles.badgeSection}>
            <Text style={styles.sectionTitle}>Trophy Room 🏆</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                {unlockedBadges.length > 0 ? unlockedBadges.map((badge) => (
                    <View key={badge.id} style={styles.badgePill}>
                        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                        <Text style={styles.badgeLabel}>{badge.label}</Text>
                    </View>
                )) : <Text style={styles.lockedText}>Resolve cases to earn trophies!</Text>}
            </ScrollView>
        </View>

        {/* HISTORY TABS */}
        <View style={styles.navRow}>
          {['active', 'archived', 'trash'].map((mode) => (
            <TouchableOpacity 
              key={mode}
              onPress={() => setViewMode(mode)} 
              style={[styles.navBtn, viewMode === mode && styles.navBtnActive]}
            >
              <Text style={[styles.navText, viewMode === mode && styles.navTextActive]}>
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
                {viewMode === 'active' ? "Rescue Folders" : viewMode === 'archived' ? "Archive" : "Trash"}
            </Text>
            {viewMode === 'trash' && (
              <TouchableOpacity onPress={emptyTrash}><Text style={styles.emptyTrashText}>EMPTY</Text></TouchableOpacity>
            )}
          </View>

          {Object.keys(groupedHistory).map((group) => (
            <View key={group} style={styles.folderContainer}>
              <TouchableOpacity style={styles.folderHeader} onPress={() => setExpandedFolder(expandedFolder === group ? null : group)}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Ionicons name={expandedFolder === group ? "folder-open" : "folder"} size={20} color={COLORS.accentAmber} />
                    <Text style={styles.folderName}>{group}</Text>
                </View>
                <Text style={styles.folderCount}>{groupedHistory[group].length}</Text>
              </TouchableOpacity>

              {expandedFolder === group && (
                <View style={styles.folderContent}>
                  {groupedHistory[group].map((item) => (
                    <View key={item.id} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyDate}>{item.createdAt?.toDate().toLocaleDateString()}</Text>
                        <View style={styles.actionIcons}>
                          {viewMode === 'trash' ? (
                            <TouchableOpacity onPress={() => permanentDelete(item.id)}><Ionicons name="trash" size={18} color="#D32F2F" /></TouchableOpacity>
                          ) : (
                            <TouchableOpacity onPress={() => moveToTrash(item.id)}><Ionicons name="trash-outline" size={18} color="#D32F2F" /></TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <Text style={styles.historySymptoms} numberOfLines={2}>{item.symptoms}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => auth.signOut()}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODALS - Reauth & Settings */}
      <Modal visible={settingsVisible} animationType="slide">
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}><Ionicons name="close" size={24}/></TouchableOpacity>
          </View>
          <ScrollView style={{padding: 20}}>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Name" />
            <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="Email" />
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New Password" secureTextEntry />
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}><Text style={styles.saveBtnText}>UPDATE</Text></TouchableOpacity>
            <TouchableOpacity style={styles.deleteAccBtn} onPress={() => {setPendingAction('delete'); setReauthVisible(true);}}>
              <Text style={styles.deleteAccText}>DELETE ACCOUNT</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={reauthVisible} transparent animationType="fade">
        <View style={styles.reauthOverlay}>
          <View style={styles.reauthBox}>
            <Text style={styles.reauthTitle}>Verify Identity</Text>
            <TextInput style={styles.input} secureTextEntry placeholder="Current Password" value={currentPassword} onChangeText={setCurrentPassword}/>
            <TouchableOpacity style={styles.saveBtn} onPress={handleReauthAndExecute}><Text style={styles.saveBtnText}>VERIFY</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setReauthVisible(false)} style={{marginTop: 15, alignItems: 'center'}}><Text>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bgPaw: { position: 'absolute', zIndex: -1, opacity: 0.4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 30, alignItems: 'center', backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  backBtn: { position: 'absolute', left: 20, top: 20, padding: 10 },
  settingsBtn: { position: 'absolute', right: 20, top: 20, padding: 10 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  userName: { fontSize: 22, fontWeight: '900', marginTop: 15, color: COLORS.primaryDark },
  roleLabel: { fontSize: 10, fontWeight: '800', color: COLORS.grayText, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -20 },
  statCard: { flex: 1, marginHorizontal: 5, alignItems: 'center', paddingVertical: 15, borderRadius: 20, backgroundColor: '#FFF' },
  statNumber: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 8, color: COLORS.grayText },
  badgeSection: { paddingHorizontal: 25, marginTop: 25 },
  badgeScroll: { paddingVertical: 10 },
  badgePill: { backgroundColor: 'white', padding: 10, borderRadius: 20, flexDirection: 'row', marginRight: 10, elevation: 1 },
  badgeEmoji: { fontSize: 20, marginRight: 8 },
  badgeLabel: { fontWeight: '900', fontSize: 12 },
  navRow: { flexDirection: 'row', marginHorizontal: 25, marginTop: 25, backgroundColor: '#EEE', borderRadius: 12, padding: 4 },
  navBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  navBtnActive: { backgroundColor: '#FFF' },
  navText: { fontSize: 10, fontWeight: '900' },
  section: { paddingHorizontal: 25, marginTop: 20 },
  folderContainer: { marginBottom: 10, backgroundColor: '#FFF', borderRadius: 15, overflow: 'hidden' },
  folderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15 },
  folderName: { fontWeight: '800', marginLeft: 10 },
  folderContent: { padding: 10, backgroundColor: '#FAFAFA' },
  historyCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  historyDate: { fontSize: 9, color: COLORS.grayText },
  historySymptoms: { fontSize: 13, marginTop: 5 },
  logoutBtn: { margin: 25, padding: 20, backgroundColor: '#FEEBEE', borderRadius: 20, alignItems: 'center' },
  logoutText: { color: '#D32F2F', fontWeight: '900' },
  modalContent: { flex: 1, backgroundColor: '#FFF' },
  input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 12, marginBottom: 10 },
  saveBtn: { backgroundColor: COLORS.primaryDark, padding: 18, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
  deleteAccBtn: { marginTop: 20, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#D32F2F', alignItems: 'center' },
  deleteAccText: { color: '#D32F2F', fontWeight: 'bold' },
  reauthOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  reauthBox: { backgroundColor: '#FFF', padding: 25, borderRadius: 25 }
});

export default ProfileScreen;