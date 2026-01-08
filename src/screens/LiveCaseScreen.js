import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, StatusBar, SafeAreaView, Linking, 
  Keyboard, Platform, Modal 
} from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { resolveCase, takeOverCase, escalateAndHandOff } from '../services/firebaseActions';
import { COLORS, GlobalStyles } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

// IMPORT MODULAR STYLES
import { styles } from '../styles/LiveCaseStyles';

/**
 * LIVE CASE SCREEN
 * Central interface for active emergencies. 
 * Handles real-time triage updates, medical protocols, and tier-based escalations.
 */
const LiveCaseScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const userProfile = params.userProfile || {}; 
  const currentUserId = userProfile.uid || auth.currentUser?.uid;
  const initialAlertId = params.alertId || params.alertData?.id;
  
  const MAX_CHAR_LIMIT = 500;

  // --- STATE ---
  const [advice, setAdvice] = useState('');
  const [liveData, setLiveData] = useState(params.alertData || null);
  const [loading, setLoading] = useState(false);
  const [flashActive, setFlashActive] = useState(false); 
  const [showTemplates, setShowTemplates] = useState(false);
  
  const isMounted = useRef(true);
  const prevNotes = useRef(params.alertData?.volunteerNotes);

  // --- ROLE LOGIC ---
  const isVolunteer = userProfile.role === 'volunteer' || !!userProfile.tierId;
  const isStudent = userProfile.tierId === 'student';
  const canTakeOver = !isStudent && isVolunteer && liveData?.status === 'escalated';

  const PROTOCOLS = [
    { label: "Bleeding", text: "Apply firm, continuous pressure to the wound with a clean cloth. Do not lift the cloth for 5 mins. Keep pet calm." },
    { label: "Heat Stroke", text: "Move pet to shade. Apply room-temp water to paws/groin. Use a fan. Do NOT use ice water." },
    { label: "Seizure", text: "Clear the area of sharp objects. Do not put hands in mouth. Note the duration. Keep room quiet." },
    { label: "Choking", text: "Check mouth for objects. If visible, sweep out carefully. If not, apply firm pressure under the ribs." }
  ];

  // ==========================================
  // 1. DATA SYNC & SUBSCRIPTIONS
  // ==========================================
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
        
        // AUTO-NAVIGATION: Student kicked back to dashboard after escalation
        if (isStudent && newData.status === 'escalated' && newData.assignedVetId !== currentUserId) {
             navigation.replace('VolunteerDashboard', { 
                 userProfile, 
                 resolvedCase: true,
                 handoff: true 
             });
             return;
        }

        // VISUAL FEEDBACK: Flash effect for owners on instruction update
        if (!isVolunteer && newData.volunteerNotes !== prevNotes.current) {
          setFlashActive(true);
          setTimeout(() => {
            if(isMounted.current) setFlashActive(false);
          }, 3000);
          prevNotes.current = newData.volunteerNotes;
        }

        setLiveData({ ...newData, id: docSnap.id });
        
        // TERMINATION LOGIC: Alert owner when case is closed
        if (!isVolunteer && newData.status === 'resolved') {
          Alert.alert(
            "Case Resolved", 
            "The volunteer has marked this case as finished.",
            [{ text: "OK", onPress: () => navigation.navigate('Home') }]
          );
        }
      }
    }, (err) => {
      console.error("Live Sync Error:", err);
    });
    return () => unsub();
  }, [initialAlertId, isVolunteer, isStudent]);

  // ==========================================
  // 2. HANDLERS (LOGIC & FIREBASE)
  // ==========================================
  const handleCall = () => {
    if (!isVolunteer) return;
    if (isStudent) {
        Alert.alert("Access Restricted", "Student accounts provide remote triage via text only.");
        return;
    }
    const phone = liveData?.ownerPhone;
    if (!phone) return Alert.alert("Error", "Phone number not available.");
    Linking.openURL(`tel:${phone}`);
  };

  const handleSendInstructions = async () => {
    if (!advice.trim()) return Alert.alert("Error", "Please enter instructions first.");
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
          } catch (e) { Alert.alert("Error", "Could not update status."); }
      }}
    ]);
  };

  const handleEscalate = () => {
    Alert.alert("Escalate Case?", "Case will be moved to Seniors for physical response.", [
        { text: "Cancel", style: "cancel" },
        { text: "Escalate", onPress: async () => {
            setLoading(true);
            const res = await escalateAndHandOff(initialAlertId, currentUserId);
            if (!res.success) {
                setLoading(false);
                Alert.alert("Error", res.error);
            }
        }}
    ]);
  };

  const handleTakeOver = async () => {
    setLoading(true);
    const result = await takeOverCase(initialAlertId, currentUserId, userProfile.name, userProfile.tierId);
    setLoading(false);
    if (!result.success) Alert.alert("Error", "Could not take over the case.");
  };

  const handleResolve = async () => {
    if (!liveData.volunteerNotes && !advice) {
        return Alert.alert("Wait", "Please provide medical instructions before resolving.");
    }
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
  };

  // ==========================================
  // 3. RENDER
  // ==========================================
  if (!liveData) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.accentCoral} /></View>;

  return (
    <View style={GlobalStyles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
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

        {/* INFO CARDS */}
        <View style={styles.section}>
          <Text style={styles.label}>{isVolunteer ? "Owner Information" : "Assigned Volunteer"}</Text>
          <View style={[GlobalStyles.card, styles.responderCard]}>
            <View style={styles.row}>
              <View>
                <Text style={styles.nameText}>{isVolunteer ? liveData.ownerName : (liveData.assignedVetName || "Searching...")}</Text>
                {!isVolunteer && liveData.assignedVetTier && (
                  <View style={styles.tierPill}>
                    <Text style={styles.tierText}>{liveData.assignedVetTier.toUpperCase()} RANK</Text>
                  </View>
                )}
              </View>
              {isVolunteer && (
                <TouchableOpacity onPress={handleCall} style={[styles.callCircle, isStudent && { backgroundColor: '#bdc3c7' }]}>
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

        {/* INSTRUCTIONS */}
        <View style={styles.section}>
          <View style={styles.row}>
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
            <View style={[styles.ownerNoteBox, !liveData.volunteerNotes && styles.waitingBox, flashActive && styles.flashHighlight]}>
                {flashActive && <Text style={styles.newUpdateBadge}>NEW UPDATE</Text>}
                <Text style={[styles.instructionText, !liveData.volunteerNotes && { fontStyle: 'italic', textAlign: 'center' }]}>
                  {liveData.volunteerNotes || "The volunteer is assessing your case. Instructions will appear here."}
                </Text>
            </View>
          )}
        </View>

        {/* ACTIONS */}
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
      </ScrollView>

      {/* MODAL */}
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

      {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={COLORS.accentCoral} /></View>}
    </View>
  );
};

export default LiveCaseScreen;