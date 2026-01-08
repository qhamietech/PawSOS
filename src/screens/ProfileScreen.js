import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar, Modal, TextInput, Dimensions } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, onSnapshot, collection, query, where, getDocs, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolder, setExpandedFolder] = useState(null);
  const [viewMode, setViewMode] = useState('active'); 

  // Settings States
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Re-auth States
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

  useEffect(() => {
    if (!profile) return;
    const loadData = async () => {
      try {
        const filterField = profile.role === 'owner' ? "ownerId" : "assignedVetId";
        const q = query(collection(db, "alerts"), where(filterField, "==", user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setHistory(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [profile]);

  // --- DYNAMIC BADGE CALCULATOR ---
  const resolvedCount = history.filter(h => h.status === 'resolved' && !h.isDeleted).length;
  const unlockedBadges = badgeThresholds.filter(b => resolvedCount >= b.level);

  // --- RE-AUTHENTICATION CORE ---
  const handleReauthAndExecute = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password to verify.");
      return;
    }
    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      setReauthVisible(false);
      setCurrentPassword('');
      if (pendingAction === 'update') {
        await executeProfileUpdate();
      } else if (pendingAction === 'delete') {
        await executeAccountDeletion();
      }
    } catch (e) {
      Alert.alert("Verification Failed", "Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = () => {
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
      await updateDoc(doc(db, "users", user.uid), { name: newName });
      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
        await updateDoc(doc(db, "users", user.uid), { email: newEmail });
      }
      if (newPassword.length > 0) {
        if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
        await updatePassword(user, newPassword);
      }
      Alert.alert("Success", "Profile updated successfully.");
      setSettingsVisible(false);
      setNewPassword('');
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "PERMANENT DELETE",
      "Your account will be removed. Rescue logs will be kept but anonymized.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Account", style: "destructive", onPress: () => {
          setPendingAction('delete');
          setReauthVisible(true);
        }}
      ]
    );
  };

  const executeAccountDeletion = async () => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
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
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // --- HISTORY ACTIONS ---
  const filteredHistory = history.filter(item => {
    if (viewMode === 'trash') return item.isDeleted === true;
    if (viewMode === 'archived') return item.isArchived === true && !item.isDeleted;
    return !item.isArchived && !item.isDeleted;
  });

  const groupedHistory = filteredHistory.reduce((groups, alert) => {
    const groupName = profile?.role === 'volunteer' 
      ? (alert.ownerName || "Unknown Owner") 
      : (alert.assignedVetName || "Pending Rescue");
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(alert);
    return groups;
  }, {});

  const handleArchiveToggle = async (alertId, isCurrentlyArchived) => {
    try {
      await updateDoc(doc(db, "alerts", alertId), { isArchived: !isCurrentlyArchived });
      setHistory(prev => prev.map(h => h.id === alertId ? { ...h, isArchived: !isCurrentlyArchived } : h));
    } catch (e) { Alert.alert("Error", "Action failed."); }
  };

  const moveToTrash = (alertId) => {
    Alert.alert("Move to Trash?", "This will hide the log.", [
      { text: "Cancel" },
      { text: "Move", onPress: async () => {
        await updateDoc(doc(db, "alerts", alertId), { isDeleted: true, deletedAt: new Date() });
        setHistory(prev => prev.map(h => h.id === alertId ? { ...h, isDeleted: true } : h));
      }}
    ]);
  };

  const restoreFromTrash = async (alertId) => {
    await updateDoc(doc(db, "alerts", alertId), { isDeleted: false, deletedAt: null });
    setHistory(prev => prev.map(h => h.id === alertId ? { ...h, isDeleted: false } : h));
  };

  const permanentDelete = (alertId) => {
    Alert.alert("Delete Permanently?", "This cannot be undone.", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, "alerts", alertId));
        setHistory(prev => prev.filter(h => h.id !== alertId));
      }}
    ]);
  };

  const emptyTrash = () => {
    const trashItems = history.filter(h => h.isDeleted);
    if (trashItems.length === 0) return;
    Alert.alert("Empty Trash?", `Permanently delete all items?`, [
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
      <Ionicons name="paw" size={120} color="#E8E8E8" style={[styles.bgPaw, {top: 350, right: -30, transform: [{rotate: '-20deg'}]}]} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: 'transparent' }}>
        
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

        <View style={styles.statsRow}>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{profile?.role === 'volunteer' ? (profile?.points || 0) : (history.filter(h => !h.isDeleted).length)}</Text>
            <Text style={styles.statLabel}>{profile?.role === 'volunteer' ? "EXP POINTS" : "TOTAL ALERTS"}</Text>
          </View>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
        </View>

        {/* --- TROPHY ROOM SECTION --- */}
        <View style={styles.badgeSection}>
            <Text style={styles.sectionTitle}>Trophy Room 🏆</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                {unlockedBadges.length > 0 ? unlockedBadges.map((badge) => (
                    <View key={badge.id} style={styles.badgePill}>
                        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                        <Text style={styles.badgeLabel}>{badge.label}</Text>
                    </View>
                )) : (
                    <Text style={styles.lockedText}>Resolve cases to unlock badges!</Text>
                )}
            </ScrollView>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setViewMode('active')} style={[styles.navBtn, viewMode === 'active' && styles.navBtnActive]}>
            <Text style={[styles.navText, viewMode === 'active' && styles.navTextActive]}>ACTIVE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('archived')} style={[styles.navBtn, viewMode === 'archived' && styles.navBtnActive]}>
            <Text style={[styles.navText, viewMode === 'archived' && styles.navTextActive]}>ARCHIVE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('trash')} style={[styles.navBtn, viewMode === 'trash' && styles.navBtnActive]}>
            <Text style={[styles.navText, viewMode === 'trash' && styles.navTextActive]}>🗑️ TRASH</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
                {viewMode === 'active' ? "Activity Folders" : viewMode === 'archived' ? "Archived Logs" : "Recycle Bin"}
            </Text>
            {viewMode === 'trash' && history.some(h => h.isDeleted) && (
              <TouchableOpacity onPress={emptyTrash}>
                <Text style={styles.emptyTrashText}>EMPTY BIN</Text>
              </TouchableOpacity>
            )}
          </View>

          {Object.keys(groupedHistory).length > 0 ? Object.keys(groupedHistory).map((group) => (
            <View key={group} style={styles.folderContainer}>
              <TouchableOpacity style={styles.folderHeader} onPress={() => setExpandedFolder(expandedFolder === group ? null : group)}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Ionicons name={expandedFolder === group ? "folder-open" : "folder"} size={20} color={COLORS.accentAmber} />
                    <Text style={styles.folderName}>{group}</Text>
                </View>
                <Text style={styles.folderCount}>{groupedHistory[group].length} items</Text>
              </TouchableOpacity>

              {expandedFolder === group && (
                <View style={styles.folderContent}>
                  {groupedHistory[group].map((item) => (
                    <View key={item.id} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyDate}>{item.createdAt?.toDate().toLocaleDateString()}</Text>
                        <View style={styles.actionIcons}>
                          {viewMode === 'trash' ? (
                            <>
                              <TouchableOpacity onPress={() => restoreFromTrash(item.id)} style={styles.iconPadding}><Ionicons name="refresh" size={18} color={COLORS.primaryDark} /></TouchableOpacity>
                              <TouchableOpacity onPress={() => permanentDelete(item.id)} style={styles.iconPadding}><Ionicons name="trash-outline" size={18} color="#D32F2F" /></TouchableOpacity>
                            </>
                          ) : (
                            <>
                              <TouchableOpacity onPress={() => handleArchiveToggle(item.id, item.isArchived)} style={styles.iconPadding}>
                                <Ionicons name={viewMode === 'archived' ? "share-outline" : "archive-outline"} size={18} color={COLORS.primaryDark} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => moveToTrash(item.id)} style={styles.iconPadding}><Ionicons name="trash-outline" size={18} color="#D32F2F" /></TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                      <Text style={styles.historySymptoms} numberOfLines={2}>{item.symptoms}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )) : (
            <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={40} color={COLORS.grayText} />
                <Text style={styles.emptyText}>No items found in {viewMode}.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODALS REMAIN UNCHANGED PER INSTRUCTION */}
      <Modal visible={settingsVisible} animationType="slide">
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Account</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.primaryDark} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{padding: 20}}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Name" />
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.inputLabel}>New Password (leave blank to keep)</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New Password" secureTextEntry />
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
              <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
            </TouchableOpacity>
            
            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <TouchableOpacity style={styles.deleteAccBtn} onPress={handleDeleteAccount}>
                <Text style={styles.deleteAccText}>DELETE ACCOUNT & DATA</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={reauthVisible} transparent animationType="fade">
        <View style={styles.reauthOverlay}>
          <View style={styles.reauthBox}>
            <Text style={styles.reauthTitle}>Verification Required</Text>
            <Text style={styles.reauthSub}>Please enter your CURRENT password to authorize these changes.</Text>
            <TextInput 
              style={styles.input} 
              secureTextEntry 
              placeholder="Current Password" 
              value={currentPassword} 
              onChangeText={setCurrentPassword}
            />
            <View style={styles.reauthActions}>
              <TouchableOpacity style={[styles.reauthBtn, {backgroundColor: '#F5F5F5'}]} onPress={() => {setReauthVisible(false); setCurrentPassword('');}}>
                <Text style={{color: COLORS.primaryDark, fontWeight: 'bold'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.reauthBtn, {backgroundColor: COLORS.primaryDark}]} onPress={handleReauthAndExecute}>
                <Text style={{color: '#FFF', fontWeight: 'bold'}}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bgPaw: { position: 'absolute', zIndex: -1, opacity: 0.4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 30, alignItems: 'center', backgroundColor: COLORS.pureWhite, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  backBtn: { position: 'absolute', left: 20, top: 20, padding: 10, zIndex: 20 },
  settingsBtn: { position: 'absolute', right: 20, top: 20, padding: 10, zIndex: 20 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  avatarText: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  userName: { fontSize: 22, fontWeight: '900', marginTop: 15, color: COLORS.primaryDark },
  roleLabel: { fontSize: 10, fontWeight: '800', color: COLORS.grayText, letterSpacing: 2, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -20, zIndex: 10 },
  statCard: { flex: 1, marginHorizontal: 5, alignItems: 'center', paddingVertical: 15, borderRadius: 20, backgroundColor: '#FFF' },
  statNumber: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark },
  statLabel: { fontSize: 8, color: COLORS.grayText, fontWeight: '800' },
  
  // Badge Styling
  badgeSection: { paddingHorizontal: 25, marginTop: 25 },
  badgeScroll: { paddingVertical: 10 },
  badgePill: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginRight: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  badgeEmoji: { fontSize: 20, marginRight: 8 },
  badgeLabel: { fontWeight: '900', fontSize: 12, color: COLORS.primaryDark },
  lockedText: { color: COLORS.grayText, fontStyle: 'italic', fontSize: 12 },

  navRow: { flexDirection: 'row', marginHorizontal: 25, marginTop: 25, backgroundColor: COLORS.ghostWhite, borderRadius: 12, padding: 4 },
  navBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  navBtnActive: { backgroundColor: '#FFF', elevation: 2 },
  navText: { fontSize: 10, fontWeight: '900', color: COLORS.grayText },
  navTextActive: { color: COLORS.primaryDark },
  section: { paddingHorizontal: 25, marginTop: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryDark },
  emptyTrashText: { fontSize: 10, fontWeight: '900', color: '#D32F2F' },
  folderContainer: { marginBottom: 10, backgroundColor: '#FFF', borderRadius: 15, overflow: 'hidden', elevation: 1 },
  folderHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  folderName: { fontSize: 14, fontWeight: '800', color: COLORS.primaryDark, marginLeft: 10 },
  folderCount: { fontSize: 11, color: COLORS.grayText, fontWeight: 'bold' },
  folderContent: { padding: 10, backgroundColor: '#FAFAFA' },
  historyCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 9, color: COLORS.grayText, fontWeight: 'bold' },
  actionIcons: { flexDirection: 'row' },
  iconPadding: { padding: 5, marginLeft: 10 },
  historySymptoms: { fontSize: 13, color: COLORS.primaryDark, marginTop: 5 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: COLORS.grayText, fontSize: 12, fontStyle: 'italic', marginTop: 10 },
  logoutBtn: { margin: 25, padding: 20, backgroundColor: '#FEEBEE', borderRadius: 20, alignItems: 'center' },
  logoutText: { color: '#D32F2F', fontWeight: '900' },
  modalContent: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#EEE', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  inputLabel: { fontSize: 12, color: COLORS.grayText, fontWeight: 'bold', marginTop: 20, marginBottom: 5 },
  input: { backgroundColor: COLORS.ghostWhite, padding: 15, borderRadius: 12 },
  saveBtn: { backgroundColor: COLORS.primaryDark, padding: 18, borderRadius: 15, marginTop: 30, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
  dangerZone: { marginTop: 40, borderTopWidth: 1, borderColor: '#EEE', paddingTop: 20 },
  dangerTitle: { color: '#D32F2F', fontWeight: 'bold', marginBottom: 10 },
  deleteAccBtn: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#D32F2F', alignItems: 'center' },
  deleteAccText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 },
  reauthOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  reauthBox: { width: '100%', backgroundColor: '#FFF', padding: 25, borderRadius: 25, elevation: 10 },
  reauthTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark, marginBottom: 5 },
  reauthSub: { fontSize: 13, color: COLORS.grayText, marginBottom: 20 },
  reauthActions: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' },
  reauthBtn: { flex: 0.48, padding: 15, borderRadius: 12, alignItems: 'center' }
});

export default ProfileScreen;