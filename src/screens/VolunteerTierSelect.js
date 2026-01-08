import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { Ionicons } from '@expo/vector-icons'; 
import { registerVolunteer } from '../services/firebaseActions';

const { width } = Dimensions.get('window');

const VolunteerTierSelect = ({ route, navigation }) => {
  // Extract baseData (name, email, password) from the previous screen
  const { baseData } = route.params;
  
  const [tier, setTier] = useState('student');
  const [loading, setLoading] = useState(false);
  
  // Dynamic Credential States
  const [uniName, setUniName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const tiers = [
    { id: 'student', title: 'Student', emoji: '🎓', restriction: 'Advice Only via Clipboard' },
    { id: 'graduate', title: 'Graduate', emoji: '📜', restriction: 'Mid-Severity Cases' },
    { id: 'qualified', title: 'Expert', emoji: '🩺', restriction: 'Full Authority/Emergency' },
  ];

  const handleFinish = async () => {
    // 1. Validation for specific tier fields
    if (tier === 'student' && (!uniName || !studentId)) {
        return Alert.alert("Required", "University name and ID are needed.");
    }
    if (tier === 'graduate' && !certNumber) {
        return Alert.alert("Required", "Certificate number is needed.");
    }
    if (tier === 'qualified' && !licenseNumber) {
        return Alert.alert("Required", "Medical License is needed.");
    }

    setLoading(true);

    // 2. Combine Personal Info with Professional Info
    const finalData = {
      ...baseData, // spread name, email, password
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

    // 3. FINAL FIREBASE CALL
    try {
        // Passing finalData as the 5th argument ensures the tierId is saved to Firestore
        const res = await registerVolunteer(
            finalData.email, 
            finalData.password, 
            finalData.name, 
            null, 
            finalData
        );
        
        setLoading(false);

        if (res.success) {
          Alert.alert("Success", "Rescue profile complete! Welcome to the team.");
          
          // Use navigation.replace to prevent users from going back to registration
          // Pass the full userProfile so the dashboard recognizes the tier immediately
          navigation.replace('VolunteerDashboard', { 
            userProfile: { 
                ...finalData,
                uid: res.uid // Ensure the UID from Firebase is attached
            } 
          });
        } else {
          Alert.alert("Error", res.error || "Something went wrong during registration.");
        }
    } catch (error) {
        setLoading(false);
        Alert.alert("Error", "A network error occurred. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={COLORS.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Qualification</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.instruction}>Select your professional status:</Text>
          
          <View style={styles.tierGrid}>
            {tiers.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => {
                    setTier(item.id);
                    setUniName(''); setStudentId(''); setCertNumber(''); setLicenseNumber('');
                }}
                style={[styles.tierCard, tier === item.id && styles.activeTier]}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={[styles.tierTitle, tier === item.id && styles.activeText]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={GlobalStyles.card}>
            <Text style={styles.restrictionText}>
              <Ionicons name="shield-checkmark" size={14} /> {tiers.find(t => t.id === tier).restriction}
            </Text>

            {tier === 'student' && (
              <>
                <Text style={styles.smallLabel}>UNIVERSITY NAME</Text>
                <TextInput style={GlobalStyles.input} placeholder="e.g. Royal Vet College" value={uniName} onChangeText={setUniName} />
                <Text style={styles.smallLabel}>STUDENT ID NUMBER</Text>
                <TextInput style={GlobalStyles.input} placeholder="ID Number" value={studentId} onChangeText={setStudentId} />
              </>
            )}
            
            {tier === 'graduate' && (
              <>
                <Text style={styles.smallLabel}>CERTIFICATE NUMBER</Text>
                <TextInput style={GlobalStyles.input} placeholder="Qualification No." value={certNumber} onChangeText={setCertNumber} />
              </>
            )}
            
            {tier === 'qualified' && (
              <>
                <Text style={styles.smallLabel}>MEDICAL LICENSE NUMBER</Text>
                <TextInput style={GlobalStyles.input} placeholder="Vet License ID" value={licenseNumber} onChangeText={setLicenseNumber} />
              </>
            )}
          </View>

          <View style={styles.finishBtnContainer}>
            <TouchableOpacity onPress={handleFinish} disabled={loading}>
                <LinearGradient colors={[COLORS.primaryDark, '#2c2c44']} style={styles.finishBtn}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.finishText}>Complete Registration</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: '900', marginLeft: 10, color: COLORS.primaryDark },
  content: { padding: 25, flexGrow: 1 },
  instruction: { fontSize: 16, fontWeight: '700', color: COLORS.grayText, marginBottom: 20 },
  tierGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  tierCard: { 
    backgroundColor: '#fff', 
    width: width * 0.26, 
    padding: 15, 
    borderRadius: 20, 
    alignItems: 'center', 
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeTier: { borderColor: COLORS.primaryDark, backgroundColor: '#f0f0ff' },
  emoji: { fontSize: 24, marginBottom: 5 },
  tierTitle: { fontSize: 12, fontWeight: '800', color: COLORS.primaryDark },
  activeText: { color: COLORS.primaryDark },
  restrictionText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '800', marginBottom: 20, textAlign: 'center', backgroundColor: '#eef2ff', padding: 8, borderRadius: 10 },
  smallLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 5, marginLeft: 2 },
  finishBtnContainer: { marginTop: 'auto', paddingTop: 20 },
  finishBtn: { borderRadius: 30, height: 60, alignItems: 'center', justifyContent: 'center' },
  finishText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});

export default VolunteerTierSelect;