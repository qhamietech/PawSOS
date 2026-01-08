import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  SafeAreaView, Alert, ActivityIndicator, Dimensions, 
  KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { Ionicons } from '@expo/vector-icons'; 
import { registerVolunteer } from '../services/firebaseActions';

const { width } = Dimensions.get('window');

/**
 * VOLUNTEER TIER SELECT (Final Step)
 * Purpose: Captures professional credentials and finalizes Firebase Auth + Firestore record.
 * Portfolio Highlight: Implements conditional form logic and complex state merging.
 */
const VolunteerTierSelect = ({ route, navigation }) => {
  // 1. Extract baseData (name, email, password) from Step 1
  const { baseData } = route.params;
  
  const [tier, setTier] = useState('student');
  const [loading, setLoading] = useState(false);
  
  // Dynamic Credential States
  const [uniName, setUniName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const tiers = [
    { id: 'student', title: 'Student', emoji: '🎓', restriction: 'Consultation & Remote Advice' },
    { id: 'graduate', title: 'Graduate', emoji: '📜', restriction: 'Mid-Severity Triage' },
    { id: 'qualified', title: 'Expert', emoji: '🩺', restriction: 'Full Emergency Authority' },
  ];

  // --- FINAL REGISTRATION LOGIC ---
  const handleFinish = async () => {
    // 1. Tier-specific validation logic
    if (tier === 'student' && (!uniName || !studentId)) {
        return Alert.alert("Missing Credentials", "Please provide your University details to consult.");
    }
    if (tier === 'graduate' && !certNumber) {
        return Alert.alert("Missing Credentials", "Certificate number is required for Graduate status.");
    }
    if (tier === 'qualified' && !licenseNumber) {
        return Alert.alert("Verification Required", "A Medical License ID is required for Expert access.");
    }

    setLoading(true);

    // 2. Data Consolidation: Merge personal and professional objects
    const finalData = {
      ...baseData, 
      tierId: tier,
      university: uniName || null,
      studentId: studentId || null,
      certificateNo: certNumber || null,
      licenseNo: licenseNumber || null,
      isRemoteOnly: tier === 'student',
      role: 'volunteer', 
      points: 0, 
      createdAt: new Date().toISOString(),
    };

    // 3. Execution: Create Auth Account & Firestore Document
    try {
        const res = await registerVolunteer(
            finalData.email, 
            finalData.password, 
            finalData.name, 
            null, // Profile Image (can be added later)
            finalData // The extra data to be stored in the 'users' collection
        );
        
        setLoading(false);

        if (res.success) {
          Alert.alert("Welcome aboard!", "Your rescue profile is now active.");
          
          // CRITICAL: Replace navigation to clear the registration stack
          navigation.replace('VolunteerDashboard', { 
            userProfile: { 
                ...finalData,
                uid: res.uid 
            } 
          });
        } else {
          Alert.alert("Registration Failed", res.error || "Please check your details and try again.");
        }
    } catch (error) {
        setLoading(false);
        Alert.alert("System Error", "Could not connect to PawSOS servers. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* CUSTOM HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Professional Status</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.instruction}>Verification helps us route the right emergencies to you.</Text>
          
          {/* TIER SELECTION GRID */}
          <View style={styles.tierGrid}>
            {tiers.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => {
                    setTier(item.id);
                    // Clear other inputs when switching to avoid data pollution
                    setUniName(''); setStudentId(''); setCertNumber(''); setLicenseNumber('');
                }}
                activeOpacity={0.8}
                style={[styles.tierCard, tier === item.id && styles.activeTier]}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={[styles.tierTitle, tier === item.id && styles.activeText]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* DYNAMIC FORM SECTION */}
          <View style={GlobalStyles.card}>
            <View style={styles.restrictionBanner}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.primaryDark} />
              <Text style={styles.restrictionText}> {tiers.find(t => t.id === tier).restriction}</Text>
            </View>

            {tier === 'student' && (
              <View>
                <Text style={styles.smallLabel}>UNIVERSITY NAME</Text>
                <TextInput style={GlobalStyles.input} placeholder="e.g. Royal Veterinary College" value={uniName} onChangeText={setUniName} />
                <Text style={styles.smallLabel}>STUDENT ID NUMBER</Text>
                <TextInput style={GlobalStyles.input} placeholder="ID Number" value={studentId} onChangeText={setStudentId} />
              </View>
            )}
            
            {tier === 'graduate' && (
              <View>
                <Text style={styles.smallLabel}>QUALIFICATION CERTIFICATE NO.</Text>
                <TextInput style={GlobalStyles.input} placeholder="e.g. CERT-99203" value={certNumber} onChangeText={setCertNumber} />
              </View>
            )}
            
            {tier === 'qualified' && (
              <View>
                <Text style={styles.smallLabel}>MEDICAL LICENSE NUMBER</Text>
                <TextInput style={GlobalStyles.input} placeholder="Official Medical ID" value={licenseNumber} onChangeText={setLicenseNumber} />
              </View>
            )}
          </View>

          {/* FINAL SUBMIT */}
          <View style={styles.finishBtnContainer}>
            <TouchableOpacity onPress={handleFinish} disabled={loading} activeOpacity={0.9}>
                <LinearGradient colors={[COLORS.primaryDark, '#1a1a2e']} style={styles.finishBtn}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.finishText}>Finalize Account</Text>
                )}
                </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: '900', marginLeft: 10, color: COLORS.primaryDark },
  content: { padding: 25, flexGrow: 1 },
  instruction: { fontSize: 14, fontWeight: '600', color: COLORS.grayText, marginBottom: 25, lineHeight: 20 },
  tierGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  tierCard: { 
    backgroundColor: '#fff', 
    width: width * 0.26, 
    paddingVertical: 20, 
    borderRadius: 20, 
    alignItems: 'center', 
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  activeTier: { borderColor: COLORS.primaryDark, backgroundColor: '#f5f7ff' },
  emoji: { fontSize: 30, marginBottom: 8 },
  tierTitle: { fontSize: 13, fontWeight: '800', color: COLORS.primaryDark },
  activeText: { color: COLORS.primaryDark },
  restrictionBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#eef2ff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 20 
  },
  restrictionText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '800' },
  smallLabel: { fontSize: 11, fontWeight: '900', color: COLORS.primaryDark, marginBottom: 8, marginLeft: 2, letterSpacing: 0.5 },
  finishBtnContainer: { marginTop: 40, paddingBottom: 20 },
  finishBtn: { borderRadius: 30, height: 65, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  finishText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});

export default VolunteerTierSelect;