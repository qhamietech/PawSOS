import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, StatusBar, SafeAreaView, Linking, Keyboard, Platform } from 'react-native';
import { db } from '../../firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { resolveCase } from '../services/firebaseActions';
import { COLORS, GlobalStyles } from '../styles/theme';

const LiveCaseScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const userProfile = params.userProfile || {}; 
  const initialAlertId = params.alertId || params.alertData?.id;
  
  // Constants
  const MAX_CHAR_LIMIT = 500;

  // State
  const [advice, setAdvice] = useState('');
  const [liveData, setLiveData] = useState(params.alertData || null);
  const [loading, setLoading] = useState(false);
  const [flashActive, setFlashActive] = useState(false); 
  const isMounted = useRef(true);
  const prevNotes = useRef(params.alertData?.volunteerNotes);

  const isVolunteer = userProfile.role === 'volunteer' || userProfile.tier !== undefined;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      setLoading(false); 
    };
  }, []);

  // REAL-TIME SYNC
  useEffect(() => {
    if (!initialAlertId) return;
    const unsub = onSnapshot(doc(db, 'alerts', initialAlertId), (docSnap) => {
      if (docSnap.exists() && isMounted.current) {
        const newData = docSnap.data();
        
        // Trigger highlight if instructions changed and user is owner
        if (!isVolunteer && newData.volunteerNotes !== prevNotes.current) {
          setFlashActive(true);
          setTimeout(() => setFlashActive(false), 3000);
          prevNotes.current = newData.volunteerNotes;
        }

        setLiveData({ ...newData, id: docSnap.id });
        
        // If case is resolved while owner is watching
        if (!isVolunteer && newData.status === 'resolved') {
          Alert.alert(
            "Case Resolved", 
            "The volunteer has marked this case as finished. Please check your Profile for the full activity log.",
            [{ text: "OK", onPress: () => navigation.navigate('Home') }]
          );
        }
      }
    });
    return () => unsub();
  }, [initialAlertId]);

  const handleCall = () => {
    if (!isVolunteer) {
        Alert.alert("Notice", "For security, only the responding volunteer can initiate calls.");
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
        advice: advice, // Storing in both for compatibility with Activity Log
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
          await updateDoc(doc(db, 'alerts', initialAlertId), { status: 'on_way' });
          const url = Platform.select({
            ios: `maps:0,0?q=${liveData.location?.lat},${liveData.location?.lng}`,
            android: `geo:0,0?q=${liveData.location?.lat},${liveData.location?.lng}`
          });
          Linking.openURL(url);
      }}
    ]);
  };

  const handleResolve = async () => {
    // Check if instructions were ever sent
    if (!liveData.volunteerNotes && !advice) {
        return Alert.alert("Wait", "Please provide at least one medical instruction or note before resolving the case.");
    }

    Alert.alert("Resolve Case", "This will close the emergency permanently and save it to the history log.", [
      { text: "Cancel" },
      { text: "Resolve", onPress: async () => {
          setLoading(true);
          try {
            // Ensure final advice is saved if typed but not "sent"
            const finalAdvice = advice || liveData.volunteerNotes;
            await updateDoc(doc(db, 'alerts', initialAlertId), { advice: finalAdvice });
            
            await resolveCase(initialAlertId, userProfile.uid);
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
            <Text style={styles.headerTitle}>{isVolunteer ? "Medical Clipboard" : "Emergency Report"}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{liveData.status?.toUpperCase()}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={{padding: 20}} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.label}>{isVolunteer ? "Owner Information" : "Assigned Volunteer"}</Text>
          <View style={[GlobalStyles.card, styles.responderCard]}>
            <View style={styles.row}>
              <View>
                <Text style={styles.nameText}>
                    {isVolunteer ? liveData.ownerName : (liveData.assignedVetName || "Searching for Responder...")}
                </Text>
                {!isVolunteer && liveData.assignedVetTier && (
                  <View style={styles.tierPill}>
                    <Text style={styles.tierText}>{liveData.assignedVetTier.toUpperCase()} RANK</Text>
                  </View>
                )}
              </View>
              {isVolunteer && (
                <TouchableOpacity onPress={handleCall} style={styles.callCircle}>
                  <Text style={{fontSize: 20}}>📞</Text>
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
          <Text style={styles.label}>Medical Instructions</Text>
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
                 {liveData.volunteerNotes || "The volunteer is assessing your case. Instructions will appear here immediately."}
               </Text>
            </View>
          )}
        </View>

        {isVolunteer && (
          <View style={{marginTop: 10}}>
            <TouchableOpacity style={styles.onWayBtn} onPress={handleOnWay}>
              <Text style={styles.onWayText}>📍 ON MY WAY (NAVIGATE)</Text>
            </TouchableOpacity>

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
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  statusBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)' },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  label: { fontSize: 11, color: '#888', fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  responderCard: { paddingVertical: 15 },
  reportCard: { backgroundColor: '#F9FAFB', borderLeftWidth: 4, borderLeftColor: COLORS.primaryDark },
  bodyText: { fontSize: 15, color: '#444', lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryDark },
  tierPill: { backgroundColor: COLORS.accentCoral + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, marginTop: 4, alignSelf: 'flex-start' },
  tierText: { color: COLORS.accentCoral, fontSize: 10, fontWeight: '900' },
  callCircle: { backgroundColor: COLORS.accentCoral, width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  input: { fontSize: 16, minHeight: 100, textAlignVertical: 'top', padding: 10 },
  charCounter: { textAlign: 'right', fontSize: 10, color: '#aaa', paddingRight: 10, marginTop: -5 },
  sendBtn: { backgroundColor: COLORS.primaryDark, padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  sendBtnText: { color: 'white', fontWeight: 'bold' },
  onWayBtn: { backgroundColor: COLORS.accentAmber, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  onWayText: { color: COLORS.primaryDark, fontWeight: 'bold' },
  resolveBtn: { backgroundColor: '#2ecc71', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  resolveBtnText: { color: 'white', fontWeight: 'bold' },
  ownerNoteBox: { padding: 20, backgroundColor: '#EBF5FF', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3498DB' },
  waitingBox: { backgroundColor: '#FDF7E2', borderColor: '#F1C40F' },
  flashHighlight: { backgroundColor: '#FFF9C4', borderColor: COLORS.accentAmber, borderWidth: 2, borderStyle: 'solid' },
  newUpdateBadge: { alignSelf: 'center', backgroundColor: COLORS.accentAmber, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8, fontSize: 10, fontWeight: 'bold' },
  instructionText: { fontSize: 17, color: COLORS.primaryDark, lineHeight: 25, fontWeight: '600' },
  onWayNotice: { marginTop: 20, padding: 15, backgroundColor: COLORS.accentAmber, borderRadius: 15, alignItems: 'center' },
  onWayNoticeText: { fontWeight: 'bold', color: COLORS.primaryDark, fontSize: 13 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }
});

export default LiveCaseScreen;