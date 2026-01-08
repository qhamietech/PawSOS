import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Image } from 'react-native';
import { registerOwner } from '../services/firebaseActions';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { Ionicons } from '@expo/vector-icons'; 

const OwnerRegister = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !phone) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    setLoading(true);
    const res = await registerOwner(email, password, name, phone);
    setLoading(false);

    if (res.success) {
      Alert.alert("Success", "Account created! Welcome to PawSOS.");
      navigation.navigate('OwnerDashboard', { user: { displayName: name } });
    } else {
      Alert.alert("Registration Failed", res.error);
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
          <Text style={styles.title}>Create Pet Owner Account</Text>
        </View>
        
        {/* Input Card */}
        <View style={GlobalStyles.card}>
          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Full Name" 
            placeholderTextColor={COLORS.grayText}
            onChangeText={setName} 
            value={name}
          />

          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Email Address" 
            placeholderTextColor={COLORS.grayText}
            onChangeText={setEmail} 
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput 
            style={GlobalStyles.input} 
            placeholder="Phone Number" 
            placeholderTextColor={COLORS.grayText}
            onChangeText={setPhone} 
            value={phone}
            keyboardType="phone-pad"
          />

          <View style={styles.passwordWrapper}>
            <TextInput 
              style={[
                GlobalStyles.input, 
                { width: '100%', marginBottom: 0, paddingRight: 45 } 
              ]} 
              placeholder="Password" 
              placeholderTextColor={COLORS.grayText}
              onChangeText={setPassword} 
              value={password}
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

          <TouchableOpacity onPress={handleSignup} disabled={loading} style={{ marginTop: 10 }}>
            <LinearGradient 
              colors={[COLORS.primaryDark, '#2c2c44']} 
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[GlobalStyles.mainButton, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={GlobalStyles.buttonText}>REGISTER</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Already have an account? <Text style={{fontWeight: 'bold'}}>Sign In</Text></Text>
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
    height: 180, // Slightly smaller than login to fit more inputs
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: -10,
    marginBottom: 10,
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
  backBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  backBtnText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    opacity: 0.8,
  },
  bgPawTop: {
    position: 'absolute',
    top: 40,
    right: -20,
    transform: [{ rotate: '30deg' }],
    opacity: 0.05,
  },
  bgPawBottom: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    transform: [{ rotate: '-20deg' }],
    opacity: 0.05,
  }
});

export default OwnerRegister;