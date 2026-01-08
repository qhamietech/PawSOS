import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, StatusBar, SafeAreaView, Linking, Keyboard, Platform, Modal } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
// Ensure these actions exist in your firebaseActions.js
import { resolveCase, notifySeniorVolunteers, takeOverCase, escalateAndHandOff } from '../services/firebaseActions';
import { COLORS, GlobalStyles } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const LiveCaseScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const userProfile = params.userProfile || {}; 
  const currentUserId = userProfile.uid || auth.currentUser?.uid;
  const initialAlertId = params.alertId || params.alertData?.id;
  
  const MAX_CHAR_LIMIT = 500;

  const [advice, setAdvice] = useState('');
  const [liveData, setLiveData] = useState(params.alertData || null);
  const [loading, setLoading] = useState(false);
  const [flashActive, setFlashActive] = useState(false); 
  const [showTemplates, setShowTemplates] = useState(false);
  
  const isMounted = useRef(true);
  const prevNotes = useRef(params.alertData?.volunteerNotes);

  const isVolunteer = userProfile.role === 'volunteer' || !!userProfile.tierId;
  const isStudent = userProfile.tierId === 'student';

  // LOGIC: Check if current senior volunteer can take over this case
  const canTakeOver = !isStudent && isVolunteer && liveData?.status === 'escalated';

  const PROTOCOLS = [
    { label: "Bleeding", text: "Apply firm, continuous pressure to the wound with a clean cloth. Do not lift the cloth for 5 mins. Keep pet calm." },
    { label: "Heat Stroke", text: "Move pet to shade. Apply room-temp water to paws/groin. Use a fan. Do NOT use ice water." },
    { label: "Seizure", text: "Clear the area of sharp objects. Do not put hands in mouth. Note the duration. Keep room quiet." },
    { label: "Choking", text: "Check mouth for objects. If visible, sweep out carefully. If not, apply firm pressure under the ribs." }
  ];

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      setLoading(false); 
    };
  }, []);

  useEffect(() => {
    if (!initialAlertId) return;
    const unsub = onSnapshot(doc(db, 'alerts', initialAlertId), (docSnap) => {
      if (docSnap.exists() && isMounted.current) {
        const newData = docSnap.data();
        
        // HANDOFF LOGIC: If a student escalates, their ID is removed. 
        // If they are no longer the assigned vet, kick them back to dashboard.
        if (isStudent && newData.status === 'escalated' && newData.assignedVetId !== currentUserId) {
             navigation.replace('VolunteerDashboard', { 
                 userProfile, 
                 resolvedCase: true,
                 handoff: true 
             });
             return;
        }

        if (!isVolunteer && newData.volunteerNotes !== prevNotes.current) {
          setFlashActive(true);
          setTimeout(() => {
            if(isMounted.current) setFlashActive(false);
          }, 3000);
          prevNotes.current = newData.volunteerNotes;
        }

        setLiveData({ ...newData, id: docSnap.id });
        
        if (!isVolunteer && newData.status === 'resolved') {
          Alert.alert(
            "Case Resolved", 
            "The volunteer has marked this case as finished. Please check your Profile for the full activity log.",
            [{ text: "OK", onPress: () => navigation.navigate('Home') }]
          );
        }
      }
    }, (err) => {
      console.error("Live Sync Error:", err);
    });
    return () => unsub();
  }, [initialAlertId, isVolunteer, isStudent]);

  const handleCall = () => {
    if (!isVolunteer) {
        Alert.alert("Notice", "For security, only the responding volunteer can initiate calls.");
        return;
    }

    if (isStudent) {
        Alert.alert(
            "Access Restricted", 
            "Student tier accounts provide remote triage via text only. Voice calls are reserved for higher tiers."
        );
        return;
    }

    const phone = liveData?.ownerPhone;
    if (!phone) return Alert.alert("Error", "Phone number not available.");
    Alert.alert("Call Owner", `Start a call with ${liveData.ownerName}?`, [
      { text: "Cancel" },
      { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) }
    ]);
  };

  const handleSendInstructions = async () => {
    if (!advice.trim()) return Alert.alert("Error", "Please enter instructions first.");
    if (advice.length > MAX_CHAR_LIMIT) return Alert.alert("Error", "Instruction is too long.");

    setLoading(true);
    try {
      await updateDoc(doc(db, 'alerts', initialAlertId), {
        volunteerNotes: advice,
        advice: advice, 
        lastUpdated: new Date()
      });
      setAdvice('');
      Keyboard.dismiss();
      setLoading(false);
      Alert.alert("Sent", "Instructions updated for the owner.");
    } catch (e) { 
      setLoading(false); 
      Alert.alert("Error", "Failed to update instructions.");
    }
  };

  const handleOnWay = async () => {
    Alert.alert("Confirm", "Notify the owner you are on your way?", [
      { text: "Cancel" },
      { text: "Go", onPress: async () => {
          try {
            await updateDoc(doc(db, 'alerts', initialAlertId), { status: 'on_way' });
            const url = Platform.select({
              ios: `maps:0,0?q=${liveData.location?.lat},${liveData.location?.lng}`,
              android: `geo:0,0?q=${liveData.location?.lat},${liveData.location?.lng}`
            });
            Linking.openURL(url);
          } catch (e) {
            Alert.alert("Error", "Could not update status.");
          }
      }}
    ]);
  };

  const handleEscalate = () => {
    Alert.alert(
      "Escalate Case?",
      "You will receive points for your triage. The case will be moved to the senior dashboard for physical response.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Escalate & Close", 
          onPress: async () => {
            setLoading(true);
            try {
              // This triggers the cloud function or firebase action to reward student and wipe assignedVetId
              const res = await escalateAndHandOff(initialAlertId, currentUserId);
              if (res.success) {
                  // Navigation is handled by the useEffect listener above
                  setLoading(false);
              } else {
                  throw new Error(res.error);
              }
            } catch (e) {
              setLoading(false);
              Alert.alert("Error", "Could not escalate.");
            }
          }
        }
      ]
    );
  };

  const handleTakeOver = async () => {
    Alert.alert("Take Over Case", "You will replace the current volunteer as the primary responder.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: async () => {
          setLoading(true);
          const result = await takeOverCase(initialAlertId, currentUserId, userProfile.name, userProfile.tierId);
          setLoading(false);
          if (result.success) {
            Alert.alert("Success", "You are now the primary responder for this case.");
          } else {
            Alert.alert("Error", "Could not take over the case.");
          }
      }}
    ]);
  };

  const handleResolve = async () => {
    if (!liveData.volunteerNotes && !advice) {
        return Alert.alert("Wait", "Please provide medical instructions before resolving the case.");
    }

    Alert.alert("Resolve Case", "This will close the emergency permanently and save it to the history log.", [
      { text: "Cancel" },
      { text: "Resolve", onPress: async () => {
          setLoading(true);
          try {
            const finalAdvice = advice || liveData.volunteerNotes;
            await updateDoc(doc(db, 'alerts', initialAlertId), { advice: finalAdvice });
            await resolveCase(initialAlertId, currentUserId);
            setLoading(false);
            navigation.replace('VolunteerDashboard', { userProfile, resolvedCase: true });
          } catch (e) {
            setLoading(false);
            Alert.alert("Error", "Could not resolve case.");
          }
      }}
    ]);
  };

  if (!liveData) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.accentCoral} /></View>;

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.darkHeader, liveData.status === 'on_way' && { backgroundColor: COLORS.accentAmber }]}>
        <SafeAreaView>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>✕ CLOSE</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.caseIdText}>CASE #{String(liveData.id).substring(0,8).toUpperCase()}</Text>
            <Text style={styles.headerTitle}>{isVolunteer ? (isStudent ? "Remote Triage Clipboard" : "Medical Clipboard") : "Emergency Report"}</Text>
            
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{liveData.status?.toUpperCase()}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={{padding: 20}} showsVerticalScrollIndicator={false}>
        
        {isVolunteer && isStudent && (
            <View style={styles.remoteWarning}>
                <Ionicons name="shield-checkmark" size={18} color="#2980B9" />
                <Text style={styles.remoteWarningText}>Student Mode: Remote Guidance Only</Text>
            </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>{isVolunteer ? "Owner Information" : "Assigned Volunteer"}</Text>
          <View style={[GlobalStyles.card, styles.responderCard]}>
            <View style={styles.row}>
              <View>
                <Text style={styles.nameText}>
                    {isVolunteer ? liveData.ownerName : (liveData.assignedVetName || "Searching...")}
                </Text>
                {!isVolunteer && liveData.assignedVetTier && (
                  <View style={styles.tierPill}>
                    <Text style={styles.tierText}>{liveData.assignedVetTier.toUpperCase()} RANK</Text>
                  </View>
                )}
              </View>
              {isVolunteer && (
                <TouchableOpacity 
                  onPress={handleCall} 
                  style={[styles.callCircle, isStudent && { backgroundColor: '#bdc3c7' }]}
                >
                  <Ionicons name={isStudent ? "call-outline" : "call"} size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{isVolunteer ? "Pet Symptoms" : "My Initial Report"}</Text>
          <View style={[GlobalStyles.card, styles.reportCard]}>
            <Text style={styles.bodyText}>{liveData.symptoms}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={styles.label}>Medical Instructions</Text>
            {isVolunteer && (
              <TouchableOpacity onPress={() => setShowTemplates(true)}>
                <Text style={styles.protocolLink}>+ USE PROTOCOLS</Text>
              </TouchableOpacity>
            )}
          </View>

          {isVolunteer ? (
            <View style={GlobalStyles.card}>
              <TextInput
                style={styles.input}
                placeholder="Type emergency instructions..."
                value={advice}
                onChangeText={setAdvice}
                maxLength={MAX_CHAR_LIMIT}
                multiline
              />
              <Text style={[styles.charCounter, advice.length >= MAX_CHAR_LIMIT && { color: COLORS.accentCoral }]}>
                {advice.length} / {MAX_CHAR_LIMIT}
              </Text>
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendInstructions}>
                <Text style={styles.sendBtnText}>UPDATE INSTRUCTIONS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[
              styles.ownerNoteBox, 
              !liveData.volunteerNotes && styles.waitingBox,
              flashActive && styles.flashHighlight
            ]}>
                {flashActive && <Text style={styles.newUpdateBadge}>NEW UPDATE</Text>}
                <Text style={[styles.instructionText, !liveData.volunteerNotes && { fontStyle: 'italic', textAlign: 'center' }]}>
                  {liveData.volunteerNotes || "The volunteer is assessing your case. Instructions will appear here."}
                </Text>
            </View>
          )}
        </View>

        {isVolunteer && (
          <View style={{marginTop: 10}}>
            {isStudent && liveData.status !== 'escalated' && (
              <TouchableOpacity style={styles.escalateBtn} onPress={handleEscalate}>
                <Text style={styles.escalateBtnText}>⚠️ ESCALATE TO SENIOR VET</Text>
              </TouchableOpacity>
            )}

            {canTakeOver && (
              <TouchableOpacity style={styles.takeOverBtn} onPress={handleTakeOver}>
                <Text style={styles.takeOverBtnText}>🤝 TAKE OVER THIS CASE</Text>
              </TouchableOpacity>
            )}

            {!isStudent && (
                <TouchableOpacity style={styles.onWayBtn} onPress={handleOnWay}>
                    <Text style={styles.onWayText}>📍 ON MY WAY (NAVIGATE)</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
              <Text style={styles.resolveBtnText}>MARK AS RESOLVED</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isVolunteer && liveData.status === 'on_way' && (
          <View style={styles.onWayNotice}>
            <Text style={styles.onWayNoticeText}>Volunteer is en route to your location.</Text>
          </View>
        )}
      </ScrollView>

      {/* Protocol Modal */}
      <Modal visible={showTemplates} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quick Protocols</Text>
            {PROTOCOLS.map((p, i) => (
              <TouchableOpacity key={i} style={styles.templateItem} onPress={() => { setAdvice(p.text); setShowTemplates(false); }}>
                <Text style={styles.templateLabel}>{p.label}</Text>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primaryDark} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeModal} onPress={() => setShowTemplates(false)}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accentCoral} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  darkHeader: { backgroundColor: COLORS.primaryDark, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { position: 'absolute', left: 20, top: Platform.OS === 'ios' ? 0 : 10, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  backButtonText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  headerContent: { alignItems: 'center' },
  caseIdText: { color: COLORS.accentCoral, fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 40 },
  statusBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)' },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  label: { fontSize: 11, color: '#888', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  responderCard: { paddingVertical: 15 },
  reportCard: { backgroundColor: '#F9FAFB', borderLeftWidth: 4, borderLeftColor: COLORS.primaryDark },
  bodyText: { fontSize: 15, color: '#444', lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryDark },
  tierPill: { backgroundColor: COLORS.accentCoral + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, marginTop: 4, alignSelf: 'flex-start' },
  tierText: { color: COLORS.accentCoral, fontSize: 10, fontWeight: '900' },
  callCircle: { backgroundColor: COLORS.accentCoral, width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  input: { fontSize: 16, minHeight: 100, textAlignVertical: 'top', padding: 10 },
  charCounter: { textAlign: 'right', fontSize: 10, color: '#aaa', paddingRight: 10 },
  sendBtn: { backgroundColor: COLORS.primaryDark, padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  sendBtnText: { color: 'white', fontWeight: 'bold' },
  onWayBtn: { backgroundColor: COLORS.accentAmber, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  onWayText: { color: COLORS.primaryDark, fontWeight: 'bold' },
  resolveBtn: { backgroundColor: '#2ecc71', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  resolveBtnText: { color: 'white', fontWeight: 'bold' },
  ownerNoteBox: { padding: 20, backgroundColor: '#EBF5FF', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3498DB' },
  waitingBox: { backgroundColor: '#FDF7E2', borderColor: '#F1C40F' },
  flashHighlight: { backgroundColor: '#FFF9C4', borderColor: COLORS.accentAmber, borderWidth: 2 },
  newUpdateBadge: { alignSelf: 'center', backgroundColor: COLORS.accentAmber, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8, fontSize: 10, fontWeight: 'bold' },
  instructionText: { fontSize: 17, color: COLORS.primaryDark, lineHeight: 25, fontWeight: '600' },
  onWayNotice: { marginTop: 20, padding: 15, backgroundColor: COLORS.accentAmber, borderRadius: 15, alignItems: 'center' },
  onWayNoticeText: { fontWeight: 'bold', color: COLORS.primaryDark },
  remoteWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F5FE', padding: 10, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#B3E5FC' },
  remoteWarningText: { color: '#0288D1', fontSize: 12, fontWeight: '800', marginLeft: 8 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  protocolLink: { color: COLORS.primaryDark, fontSize: 11, fontWeight: 'bold', textDecorationLine: 'underline' },
  escalateBtn: { backgroundColor: COLORS.accentCoral, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  escalateBtnText: { color: 'white', fontWeight: 'bold' },
  takeOverBtn: { backgroundColor: '#8E44AD', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  takeOverBtnText: { color: 'white', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, minHeight: 300 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: COLORS.primaryDark },
  templateItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  templateLabel: { fontSize: 16, color: '#444', fontWeight: '600' },
  closeModal: { backgroundColor: COLORS.primaryDark, padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' }
});

export default LiveCaseScreen;