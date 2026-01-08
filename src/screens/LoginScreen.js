import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Image } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { Ionicons } from '@expo/vector-icons'; 

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      setLoading(false);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'volunteer') {
          navigation.navigate('VolunteerDashboard', { userProfile: userData });
        } else {
          navigation.navigate('OwnerDashboard', { userProfile: userData });
        }
      } else {
        Alert.alert("Error", "User data not found.");
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = error.message.includes('auth/invalid-credential') 
        ? "Invalid email or password." 
        : error.message;
      Alert.alert("Login Failed", errorMessage);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      return Alert.alert("Email Required", "Please enter your email address to reset your password.");
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset link sent to your email!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={GlobalStyles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* Decorative Paw Prints Background */}
      <Ionicons name="paw" size={120} color={COLORS.primaryDark} style={styles.bgPawTop} />
      <Ionicons name="paw" size={160} color={COLORS.primaryDark} style={styles.bgPawBottom} />

      <View style={GlobalStyles.inner}>
        
        {/* Branding Area with Large Logo */}
        <View style={styles.headerArea}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Input Card */}
        <View style={GlobalStyles.card}>
          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Email Address" 
            placeholderTextColor={COLORS.grayText}
            value={email}
            onChangeText={setEmail} 
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <View style={styles.passwordWrapper}>
            <TextInput 
              style={[
                GlobalStyles.input, 
                { width: '100%', marginBottom: 0, paddingRight: 45 } 
              ]} 
              placeholder="Password" 
              placeholderTextColor={COLORS.grayText}
              value={password}
              onChangeText={setPassword} 
              secureTextEntry={!showPassword} 
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
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

        {/* Navigation Links */}
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

const styles = StyleSheet.create({
  headerArea: {
    width: '100%',
    marginBottom: 10, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: 250,
  },
  passwordWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative', 
  },
  eyeIcon: {
    position: 'absolute',
    right: 12, 
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, 
    width: 30, 
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 5,
  },
  forgotPasswordText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  footerLinks: { 
    marginTop: 40, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  linkText: { 
    color: COLORS.primaryDark, 
    fontSize: 14,
    opacity: 0.9
  },
  bold: {
    fontWeight: '800',
    color: COLORS.accentCoral,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayText,
    marginHorizontal: 15,
    opacity: 0.5
  },
  // Paw Decoration Styles
  bgPawTop: {
    position: 'absolute',
    top: 40,
    right: -20,
    transform: [{ rotate: '30deg' }],
    opacity: 0.06,
  },
  bgPawBottom: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    transform: [{ rotate: '-20deg' }],
    opacity: 0.06,
  }
});

export default LoginScreen;