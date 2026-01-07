import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar, Share, Modal, TextInput } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, onSnapshot, collection, query, where, getDocs, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolder, setExpandedFolder] = useState(null);
  const [viewMode, setViewMode] = useState('active'); // 'active', 'archived', or 'trash'

  // Settings States
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Re-auth States
  const [reauthVisible, setReauthVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // 'update' or 'delete'

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

  // --- ACCOUNT ACTIONS ---

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
      "Your account will be removed. Rescue logs will be kept but anonymized so volunteers keep their history.",
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
      
      // ANONYMIZATION LOGIC:
      // We scrub personal data so the community keeps the rescue logs without identifying you.
      history.forEach(item => {
        const alertRef = doc(db, "alerts", item.id);
        batch.update(alertRef, { 
          ownerId: "DELETED_USER", 
          ownerName: "Former Member",
          ownerPhone: null,
          isArchived: true 
        });
      });

      // Delete user profile document
      batch.delete(doc(db, "users", user.uid));
      
      await batch.commit();

      // Delete auth user
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
    Alert.alert("Move to Trash?", "This will hide the log. You can restore it from the bin later.", [
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

    Alert.alert("Empty Trash?", `Permanently delete all ${trashItems.length} items?`, [
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
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsVisible(true)}>
            <Text style={{fontSize: 22}}>⚙️</Text>
          </TouchableOpacity>

          <LinearGradient colors={[COLORS.primaryDark, COLORS.surfaceDark]} style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{profile?.name?.charAt(0)}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{profile?.name}</Text>
          <Text style={styles.roleLabel}>{profile?.role?.toUpperCase()}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{profile?.role === 'volunteer' ? (profile?.points || 0) : (history.filter(h => !h.isDeleted).length)}</Text>
            <Text style={styles.statLabel}>{profile?.role === 'volunteer' ? "EXP POINTS" : "TOTAL ALERTS"}</Text>
          </View>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{history.filter(h => h.status === 'resolved' && !h.isDeleted).length}</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
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
                <Text style={styles.folderName}>{group}</Text>
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
                            <>
                              <TouchableOpacity onPress={() => restoreFromTrash(item.id)}><Text style={styles.iconButton}>🔄</Text></TouchableOpacity>
                              <TouchableOpacity onPress={() => permanentDelete(item.id)}><Text style={styles.iconButton}>❌</Text></TouchableOpacity>
                            </>
                          ) : (
                            <>
                              <TouchableOpacity onPress={() => handleArchiveToggle(item.id, item.isArchived)}>
                                <Text style={styles.iconButton}>{viewMode === 'archived' ? "📤" : "📥"}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => moveToTrash(item.id)}><Text style={styles.iconButton}>🗑️</Text></TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                      <Text style={styles.historySymptoms}>{item.symptoms}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )) : (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>No items found here.</Text></View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SETTINGS MODAL */}
      <Modal visible={settingsVisible} animationType="slide">
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Account</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
               <Text style={{fontSize: 20}}>✕</Text>
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
              
              <TouchableOpacity style={[styles.logoutBtn, {marginHorizontal: 0, marginTop: 15}]} onPress={handleLogout}>
                <Text style={styles.logoutText}>LOGOUT FROM ALL DEVICES</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* RE-AUTH MODAL (Verification) */}
      <Modal visible={reauthVisible} transparent animationType="fade">
        <View style={styles.reauthOverlay}>
          <View style={styles.reauthBox}>
            <Text style={styles.reauthTitle}>Security Verification</Text>
            <Text style={styles.reauthSub}>Please enter your CURRENT password to authorize these changes.</Text>
            
            <TextInput 
              style={styles.input} 
              secureTextEntry 
              placeholder="Current Password" 
              value={currentPassword} 
              onChangeText={setCurrentPassword}
            />

            <View style={styles.reauthActions}>
              <TouchableOpacity 
                style={[styles.reauthBtn, {backgroundColor: '#F5F5F5'}]} 
                onPress={() => {setReauthVisible(false); setCurrentPassword('');}}
              >
                <Text style={{color: COLORS.primaryDark, fontWeight: 'bold'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.reauthBtn, {backgroundColor: COLORS.primaryDark}]} 
                onPress={handleReauthAndExecute}
              >
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 30, alignItems: 'center', backgroundColor: COLORS.pureWhite, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  settingsBtn: { position: 'absolute', right: 20, top: 20 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  avatarText: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  userName: { fontSize: 22, fontWeight: '900', marginTop: 15, color: COLORS.primaryDark },
  roleLabel: { fontSize: 10, fontWeight: '800', color: COLORS.grayText, letterSpacing: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -20, zIndex: 10 },
  statCard: { flex: 1, marginHorizontal: 5, alignItems: 'center', paddingVertical: 15, borderRadius: 20, backgroundColor: '#FFF' },
  statNumber: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark },
  statLabel: { fontSize: 8, color: COLORS.grayText, fontWeight: '800' },
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
  folderName: { fontSize: 14, fontWeight: '800', color: COLORS.primaryDark },
  folderCount: { fontSize: 11, color: COLORS.grayText, fontWeight: 'bold' },
  folderContent: { padding: 10, backgroundColor: '#FAFAFA' },
  historyCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#EEE' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 9, color: COLORS.grayText, fontWeight: 'bold' },
  actionIcons: { flexDirection: 'row' },
  iconButton: { fontSize: 16, marginLeft: 12 },
  historySymptoms: { fontSize: 13, color: COLORS.primaryDark, marginTop: 5 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: COLORS.grayText, fontSize: 12, fontStyle: 'italic' },
  logoutBtn: { margin: 25, padding: 20, backgroundColor: '#FEEBEE', borderRadius: 20, alignItems: 'center' },
  logoutText: { color: '#D32F2F', fontWeight: '900' },
  modalContent: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#EEE' },
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