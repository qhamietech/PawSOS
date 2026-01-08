import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, 
  StatusBar, Image, ScrollView 
} from 'react-native';

// FIREBASE & ACTIONS
import { registerOwner } from '../services/firebaseActions';

// THEME & STYLES
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { styles } from '../styles/RegisterStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; 

/**
 * OWNER REGISTRATION SCREEN
 * Handles the creation of new Pet Owner accounts.
 * Integrates with registerOwner service to handle Firebase Auth and Firestore profile creation.
 */
const OwnerRegister = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1. SIGNUP LOGIC
  const handleSignup = async () => {
    // Basic validation
    if (!name || !email || !password || !phone) {
      return Alert.alert("Missing Info", "Please fill in all fields to protect your pets.");
    }

    if (password.length < 6) {
      return Alert.alert("Security", "Password should be at least 6 characters.");
    }

    setLoading(true);
    try {
      const res = await registerOwner(email, password, name, phone);
      setLoading(false);

      if (res.success) {
        Alert.alert("Welcome!", "Your PawSOS account is ready.");
        // Navigate to dashboard and reset stack to prevent going back to register
        navigation.replace('OwnerDashboard', { user: { displayName: name } });
      } else {
        Alert.alert("Registration Failed", res.error || "Something went wrong.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={GlobalStyles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* DECORATIVE BACKGROUND */}
      <Ionicons name="paw" size={120} color={COLORS.primaryDark} style={styles.bgPawTop} />
      <Ionicons name="paw" size={160} color={COLORS.primaryDark} style={styles.bgPawBottom} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={GlobalStyles.inner}>
          
          {/* BRANDING */}
          <View style={styles.headerArea}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Pet Owner Account</Text>
          </View>
          
          {/* REGISTRATION FORM */}
          <View style={GlobalStyles.card}>
            <TextInput 
              style={GlobalStyles.input} 
              placeholder="Full Name" 
              placeholderTextColor="#999"
              onChangeText={setName} 
              value={name}
              autoCorrect={false}
            />

            <TextInput 
              style={GlobalStyles.input} 
              placeholder="Email Address" 
              placeholderTextColor="#999"
              onChangeText={setEmail} 
              value={email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <TextInput 
              style={GlobalStyles.input} 
              placeholder="Phone Number" 
              placeholderTextColor="#999"
              onChangeText={setPhone} 
              value={phone}
              keyboardType="phone-pad"
            />

            {/* Password with Toggle */}
            <View style={styles.passwordWrapper}>
              <TextInput 
                style={[
                  GlobalStyles.input, 
                  { width: '100%', marginBottom: 0, paddingRight: 45 } 
                ]} 
                placeholder="Password" 
                placeholderTextColor="#999"
                onChangeText={setPassword} 
                value={password}
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

            {/* Submit Button */}
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
              activeOpacity={0.6}
            >
              <Text style={styles.backBtnText}>
                Already have an account? <Text style={{fontWeight: 'bold', color: COLORS.accentCoral}}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OwnerRegister;