import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, 
  StatusBar, Image 
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; 

// THEME & STYLES
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { styles } from '../styles/LoginStyles';

/**
 * LOGIN SCREEN
 * Handles authentication and role-based navigation.
 * Uses Firebase Auth for login and Firestore to determine user roles 
 * (Volunteer vs Owner) to direct them to the correct dashboard.
 */
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1. LOGIN LOGIC
  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Required Fields", "Please enter both email and password.");
    }

    setLoading(true);
    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      setLoading(false);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Role-based Navigation
        if (userData.role === 'volunteer') {
          navigation.navigate('VolunteerDashboard', { userProfile: userData });
        } else {
          navigation.navigate('OwnerDashboard', { userProfile: userData });
        }
      } else {
        Alert.alert("Account Error", "Profile details not found in database.");
      }
    } catch (error) {
      setLoading(false);
      // Clean up common Firebase error messages for better UX
      const errorMessage = error.message.includes('auth/invalid-credential') 
        ? "Invalid email or password. Please try again." 
        : error.message;
      Alert.alert("Login Failed", errorMessage);
    }
  };

  // 2. PASSWORD RESET LOGIC
  const handleForgotPassword = async () => {
    if (!email) {
      return Alert.alert("Input Needed", "Enter your email above to receive a reset link.");
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Link Sent", "Check your inbox for password reset instructions!");
    } catch (error) {
      Alert.alert("Reset Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={GlobalStyles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* DECORATIVE BACKGROUND ELEMENTS */}
      <Ionicons name="paw" size={120} color={COLORS.primaryDark} style={styles.bgPawTop} />
      <Ionicons name="paw" size={160} color={COLORS.primaryDark} style={styles.bgPawBottom} />

      <View style={GlobalStyles.inner}>
        
        {/* BRANDING AREA */}
        <View style={styles.headerArea}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* INPUT CARD */}
        <View style={GlobalStyles.card}>
          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Email Address" 
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail} 
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          {/* Password Field with Eye Toggle */}
          <View style={styles.passwordWrapper}>
            <TextInput 
              style={[
                GlobalStyles.input, 
                { width: '100%', marginBottom: 0, paddingRight: 45 } 
              ]} 
              placeholder="Password" 
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword} 
              secureTextEntry={!showPassword} 
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showPassword ? "eye" : "eye-off"} 
                size={22} 
                color={COLORS.primaryDark} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <LinearGradient 
              colors={[COLORS.primaryDark, '#2c2c44']} 
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[GlobalStyles.mainButton, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={GlobalStyles.buttonText}>SIGN IN</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* REGISTRATION LINKS */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => navigation.navigate('OwnerRegister')}>
            <Text style={styles.linkText}>Join as <Text style={styles.bold}>Pet Owner</Text></Text>
          </TouchableOpacity>
          
          <View style={styles.dot} />

          <TouchableOpacity onPress={() => navigation.navigate('VolunteerRegister')}>
            <Text style={styles.linkText}>Join as <Text style={styles.bold}>Vet Volunteer</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;