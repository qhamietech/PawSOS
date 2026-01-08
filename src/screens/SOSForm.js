import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, ScrollView, SafeAreaView, 
  Dimensions, StatusBar 
} from 'react-native'; 
import { Picker } from '@react-native-picker/picker'; 
import * as Location from 'expo-location'; 

// FIREBASE & THEME
import { triggerSOS } from '../services/firebaseActions'; 
import { auth } from '../../firebaseConfig'; 
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; 
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * SOS FORM SCREEN
 * Purpose: Allows pet owners to broadcast an emergency signal with geolocation.
 * Features: Expo Location integration, Firebase real-time broadcast, and priority levels.
 */
const SOSForm = ({ navigation }) => {
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('low');
  const [loading, setLoading] = useState(false);

  // --- SOS BROADCAST LOGIC ---
  const handleSOS = async () => {
    if (!symptoms.trim()) {
      return Alert.alert("Required", "Please describe the symptoms so volunteers know what to bring.");
    }

    setLoading(true);

    try {
      // 1. Request Geolocation Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return Alert.alert(
          "Location Required", 
          "We need your GPS coordinates to alert nearby volunteers."
        );
      }

      // 2. Get Precise Coordinates
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const sanitizedLocation = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      };

      const user = auth.currentUser;

      // 3. Trigger Firebase Action
      const res = await triggerSOS(
        user.uid,
        user.displayName || "Pet Owner",
        symptoms,
        sanitizedLocation,
        severity,
        null 
      );

      setLoading(false);

      if (res.success) {
        Alert.alert(
          "SOS Broadcasted!", 
          "Nearby volunteers have been notified with your location."
        );
        // Return to Dashboard where the "Active Case" listener will pick it up
        navigation.goBack(); 
      } else {
        Alert.alert("System Error", res.error);
      }
    } catch (error) {
      setLoading(false);
      console.error("SOS Submit Error: ", error);
      Alert.alert("Error", "Could not send SOS. Please check your connection.");
    }
  };

  return (
    <SafeAreaView style={[GlobalStyles.container, { backgroundColor: '#FBFBFB' }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* TOP NAVIGATION */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeCircle}>
           <Ionicons name="close" size={24} color={COLORS.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollPadding} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* EMERGENCY HEADER */}
        <View style={styles.header}>
          <Text style={styles.brandText}>Emergency Request</Text>
          <Text style={styles.title}>Send for Help</Text>
          <Text style={styles.subtitle}>
            Describe the situation below. Nearby volunteers and vets will be alerted to your GPS location immediately.
          </Text>
        </View>

        {/* PRIORITY SELECTION */}
        <Text style={styles.sectionLabel}>Severity Level</Text>
        <View style={[GlobalStyles.card, styles.pickerCard]}>
          <View style={styles.pickerWrapper}>
            <Picker 
              selectedValue={severity} 
              onValueChange={(v) => setSeverity(v)}
              style={styles.picker}
              dropdownIconColor={COLORS.primaryDark}
            >
              <Picker.Item label="🟢 Low (Advice / Minor Injury)" value="low" />
              <Picker.Item label="🟡 Mid (Urgent / Non-Critical)" value="mid" />
              <Picker.Item label="🔴 High (Critical / Life Threatening)" value="high" />
            </Picker>
          </View>
        </View>

        {/* DESCRIPTION INPUT */}
        <Text style={styles.sectionLabel}>What is happening?</Text>
        <TextInput 
          style={styles.textInputLarge} 
          placeholder="Describe symptoms (e.g. bleeding, limping, lethargy)..." 
          multiline 
          numberOfLines={6}
          value={symptoms}
          onChangeText={setSymptoms}
          placeholderTextColor={COLORS.grayText}
          blurOnSubmit={true}
        />

        {/* SUBMIT BROADCAST */}
        <TouchableOpacity 
          style={styles.btnWrapper} 
          onPress={handleSOS} 
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient 
            colors={[COLORS.primaryDark, '#2c2c44']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 0}}
            style={styles.btnGradient}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.pureWhite} />
            ) : (
              <View style={styles.btnContent}>
                <Text style={[GlobalStyles.buttonText, { fontSize: 18 }]}>BROADCAST SOS</Text>
                <View style={styles.btnIconCircle}>
                    <Ionicons name="megaphone" size={20} color={COLORS.primaryDark} />
                </View>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Your current GPS coordinates will be shared with responders.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 25, paddingTop: 10, alignItems: 'flex-end' },
  closeCircle: { backgroundColor: COLORS.ghostWhite, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scrollPadding: { padding: 25, paddingBottom: 50 },
  header: { marginBottom: 30, marginTop: 10 },
  brandText: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: COLORS.accentCoral, 
    letterSpacing: 2, 
    textTransform: 'uppercase', 
    marginBottom: 8 
  },
  title: { 
    fontSize: 42, 
    fontWeight: '900', 
    color: COLORS.primaryDark, 
    lineHeight: 45 
  },
  subtitle: { 
    fontSize: 15, 
    color: COLORS.grayText, 
    marginTop: 15, 
    lineHeight: 22,
    fontWeight: '500'
  },
  sectionLabel: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: COLORS.primaryDark, 
    marginBottom: 12, 
    marginTop: 25 
  },
  pickerCard: { paddingVertical: 0, paddingHorizontal: 15, borderRadius: 20, borderTopWidth: 0 },
  pickerWrapper: { height: 60, justifyContent: 'center' },
  picker: { color: COLORS.primaryDark },
  textInputLarge: { 
    backgroundColor: COLORS.pureWhite, 
    borderRadius: 25, 
    padding: 20, 
    height: 160, 
    textAlignVertical: 'top', 
    fontSize: 16,
    color: COLORS.primaryDark,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  btnWrapper: { marginTop: 40, height: 75, borderRadius: 38, overflow: 'hidden', elevation: 5 },
  btnGradient: { flex: 1, justifyContent: 'center', paddingHorizontal: 25 },
  btnContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnIconCircle: { 
    backgroundColor: COLORS.pureWhite, 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  footerNote: {
    textAlign: 'center',
    color: COLORS.grayText,
    fontSize: 11,
    marginTop: 20,
    fontStyle: 'italic'
  }
});

export default SOSForm;