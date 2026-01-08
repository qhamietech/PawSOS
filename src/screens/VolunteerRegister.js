import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, SafeAreaView, Image, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { Ionicons } from '@expo/vector-icons'; 

const VolunteerRegister = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleNext = () => {
    // Trim inputs to prevent invisible character errors in Firebase/Navigation
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password) {
      return Alert.alert("Error", "Please fill in all fields to continue.");
    }

    // Basic email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(cleanEmail)) {
      return Alert.alert("Error", "Please enter a valid email address.");
    }

    // Password length validation
    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters.");
    }

    // Navigate to the next step and pass the cleaned data
    // The 'role' is intentionally NOT set here, it is handled in Step 2
    navigation.navigate('VolunteerTierSelect', { 
      baseData: { 
        name: cleanName, 
        email: cleanEmail, 
        password: password 
      } 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background Decorative Elements */}
      <Ionicons name="paw" size={120} color={COLORS.primaryDark} style={styles.bgPawTop} />
      <Ionicons name="paw" size={160} color={COLORS.primaryDark} style={styles.bgPawBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.mainHeading}>Rescue Team</Text>
          <Text style={styles.subHeading}>Step 1: Personal Details</Text>
        </View>

        <View style={GlobalStyles.card}>
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Full Name" 
            placeholderTextColor={COLORS.grayText} 
            value={name} 
            onChangeText={setName} 
          />

          <Text style={styles.inputLabel}>EMAIL</Text>
          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Email" 
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

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleNext}>
            <LinearGradient colors={[COLORS.primaryDark, '#2c2c44']} style={styles.mainBtn}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' }, 
  scrollContent: { padding: 25, paddingBottom: 40 },
  headerArea: { width: '100%', marginBottom: 20, alignItems: 'center' },
  logo: { width: '100%', height: 100 },
  mainHeading: { fontSize: 28, fontWeight: '900', color: COLORS.primaryDark, marginTop: 5 },
  subHeading: { fontSize: 14, color: COLORS.grayText, fontWeight: '600', marginTop: 4 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: COLORS.primaryDark, letterSpacing: 1, marginBottom: 4 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  passwordInput: { flex: 1, height: '100%', fontSize: 16, color: '#1A1A1A' },
  eyeBtn: { padding: 5, justifyContent: 'center', alignItems: 'center' },
  footer: { marginTop: 30 },
  mainBtn: { borderRadius: 30, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  signInLink: { marginTop: 20, alignItems: 'center' },
  signInText: { color: COLORS.primaryDark, fontSize: 14, opacity: 0.8 },
  signInBold: { fontWeight: 'bold', textDecorationLine: 'underline' },
  bgPawTop: { position: 'absolute', top: 40, right: -20, transform: [{ rotate: '30deg' }], opacity: 0.05 },
  bgPawBottom: { position: 'absolute', bottom: 20, left: -30, transform: [{ rotate: '-20deg' }], opacity: 0.05 }
});

export default VolunteerRegister;