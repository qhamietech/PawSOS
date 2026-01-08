import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, Dimensions, SafeAreaView, Image, StatusBar, 
  Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { Ionicons } from '@expo/vector-icons'; 

/**
 * VOLUNTEER REGISTER (STEP 1)
 * Purpose: Captures core user identity before moving to specialized tier selection.
 * Portfolio Note: Demonstrates handling of multi-step form state and input sanitization.
 */
const VolunteerRegister = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- FORM VALIDATION & NAVIGATION ---
  const handleNext = () => {
    // 1. Trim inputs to prevent invisible character errors in Firebase/Navigation
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    // 2. Comprehensive Field Check
    if (!cleanName || !cleanEmail || !password) {
      return Alert.alert("Missing Info", "Please fill in all fields to join the rescue team.");
    }

    // 3. Regex Email Validation (Standard Security Practice)
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(cleanEmail)) {
      return Alert.alert("Invalid Email", "Please enter a valid email address format.");
    }

    // 4. Password Strength Check
    if (password.length < 6) {
      return Alert.alert("Security Notice", "For your safety, passwords must be at least 6 characters.");
    }

    // 5. Data Persistence across Nav Stack
    // We pass the data to Step 2 (Tier Select) to keep the app stateless and efficient
    navigation.navigate('VolunteerTierSelect', { 
      baseData: { 
        name: cleanName, 
        email: cleanEmail, 
        password: password,
        role: 'volunteer' // Explicitly marking the intended path
      } 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* DECORATIVE BRANDING: Subtle background paws for premium feel */}
      <Ionicons name="paw" size={120} color={COLORS.primaryDark} style={styles.bgPawTop} />
      <Ionicons name="paw" size={160} color={COLORS.primaryDark} style={styles.bgPawBottom} />

      {/* KeyboardAvoidingView ensures inputs aren't hidden by the keyboard on smaller devices */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* BRANDING HEADER */}
          <View style={styles.headerArea}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={styles.mainHeading}>Rescue Team</Text>
            <Text style={styles.subHeading}>Step 1: Personal Details</Text>
          </View>

          {/* FORM CARD */}
          <View style={[GlobalStyles.card, { paddingVertical: 30 }]}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput 
              style={GlobalStyles.input} 
              placeholder="e.g. Dr. Jane Smith" 
              placeholderTextColor={COLORS.grayText} 
              value={name} 
              onChangeText={setName} 
            />

            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput 
              style={GlobalStyles.input} 
              placeholder="vet@example.com" 
              placeholderTextColor={COLORS.grayText} 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address" 
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput} 
                placeholder="••••••••"
                placeholderTextColor={COLORS.grayText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                  style={styles.eyeBtn} 
                  onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={22} 
                  color={COLORS.primaryDark} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleNext} activeOpacity={0.9}>
              <LinearGradient 
                colors={[COLORS.primaryDark, '#2c2c44']} 
                style={styles.mainBtn}
              >
                <Text style={styles.btnText}>Choose My Tier</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 10}} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signInLink} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInText}>
                Already a member? <Text style={styles.signInBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' }, 
  scrollContent: { padding: 25, paddingBottom: 40 },
  headerArea: { width: '100%', marginBottom: 25, alignItems: 'center' },
  logo: { width: '100%', height: 100 },
  mainHeading: { fontSize: 32, fontWeight: '900', color: COLORS.primaryDark, marginTop: 5 },
  subHeading: { fontSize: 14, color: COLORS.grayText, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: COLORS.primaryDark, letterSpacing: 1, marginBottom: 8 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  passwordInput: { flex: 1, height: '100%', fontSize: 16, color: '#1A1A1A' },
  eyeBtn: { padding: 5, justifyContent: 'center', alignItems: 'center' },
  footer: { marginTop: 30 },
  mainBtn: { borderRadius: 30, height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  signInLink: { marginTop: 25, alignItems: 'center' },
  signInText: { color: COLORS.primaryDark, fontSize: 14, opacity: 0.8 },
  signInBold: { fontWeight: 'bold', textDecorationLine: 'underline' },
  bgPawTop: { position: 'absolute', top: 40, right: -20, transform: [{ rotate: '30deg' }], opacity: 0.04 },
  bgPawBottom: { position: 'absolute', bottom: 20, left: -30, transform: [{ rotate: '-20deg' }], opacity: 0.04 }
});

export default VolunteerRegister;