import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; 

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields.");

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
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={GlobalStyles.container}
    >
      <StatusBar barStyle="dark-content" />
      <View style={GlobalStyles.inner}>
        
        {/* Branding with New Accent Color */}
        <View style={styles.headerArea}>
          <Text style={styles.logoText}>Paw<Text style={{color: COLORS.accentCoral}}>SOS</Text> 🐾</Text>
          <Text style={styles.subtitle}>Saving lives, one paw at a time.</Text>
        </View>
        
        <View style={GlobalStyles.card}>
          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Email Address" 
            placeholderTextColor={COLORS.grayText}
            onChangeText={setEmail} 
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Password" 
            placeholderTextColor={COLORS.grayText}
            onChangeText={setPassword} 
            secureTextEntry 
          />

          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <LinearGradient 
              colors={[COLORS.primaryDark, COLORS.surfaceDark]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[GlobalStyles.mainButton, loading && { opacity: 0.7 }]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={GlobalStyles.buttonText}>SIGN IN</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => navigation.navigate('OwnerRegister')}>
            <Text style={styles.linkText}>Join as <Text style={styles.bold}>Pet Owner</Text></Text>
          </TouchableOpacity>
          
          <View style={styles.dot} />

          <TouchableOpacity onPress={() => navigation.navigate('VolunteerRegister')}>
            <Text style={styles.linkText}>Become a <Text style={styles.bold}>Volunteer</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerArea: {
    marginBottom: 50,
    alignItems: 'center'
  },
  logoText: { 
    fontSize: 52, 
    fontWeight: '900', 
    color: COLORS.primaryDark, 
    letterSpacing: -1.5
  },
  subtitle: {
    color: COLORS.grayText,
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500'
  },
  footerLinks: { 
    marginTop: 40, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  linkText: { 
    color: COLORS.primaryDark, 
    fontSize: 14,
    opacity: 0.8
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
  }
});

export default LoginScreen;