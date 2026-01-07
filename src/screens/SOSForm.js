import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, SafeAreaView, Dimensions, StatusBar } from 'react-native'; 
import { Picker } from '@react-native-picker/picker'; 
import * as Location from 'expo-location'; 
import { triggerSOS } from '../services/firebaseActions'; 
import { auth } from '../../firebaseConfig'; 
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GlobalStyles } from '../styles/theme'; // Import your clean theme

const { width } = Dimensions.get('window');

const SOSForm = ({ navigation }) => {
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('low');
  const [loading, setLoading] = useState(false);

  // LOGIC PRESERVED: handleSOS function remains exactly as requested
  const handleSOS = async () => {
    if (!symptoms) return Alert.alert("Error", "Please describe the symptoms.");

    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return Alert.alert("Permission Denied", "We need location to send help.");
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      
      const sanitizedLocation = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      };

      const user = auth.currentUser;

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
        Alert.alert("SOS Sent!", "Volunteers have been notified.");
        navigation.goBack();
      } else {
        Alert.alert("Error", res.error);
      }
    } catch (error) {
      setLoading(false);
      console.error("SOS Submit Error: ", error);
      Alert.alert("Error", "Could not send SOS. Check your internet connection.");
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        
        {/* HEADER: Clean & Authoritative */}
        <View style={styles.header}>
          <Text style={styles.brandText}>Emergency Request</Text>
          <Text style={styles.title}>Send for Help</Text>
          <Text style={styles.subtitle}>
            Describe the situation below. Nearby volunteers will be alerted immediately.
          </Text>
        </View>

        {/* SEVERITY: Using the "Bento" card style from theme */}
        <Text style={styles.sectionLabel}>Severity Level</Text>
        <View style={GlobalStyles.card}>
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

        {/* INPUT: Premium Rounded Input */}
        <Text style={styles.sectionLabel}>What is happening?</Text>
        <TextInput 
          style={styles.textInputLarge} 
          placeholder="Describe symptoms (e.g. bleeding, limping, lethargy)..." 
          multiline 
          numberOfLines={6}
          onChangeText={setSymptoms}
          placeholderTextColor={COLORS.grayText}
        />

        {/* ACTION: The Midnight Capsule Button */}
        <TouchableOpacity 
          style={styles.btnWrapper} 
          onPress={handleSOS} 
          disabled={loading}
        >
          <LinearGradient 
            colors={[COLORS.primaryDark, '#333333']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 0}}
            style={styles.btnGradient}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.pureWhite} />
            ) : (
              <View style={styles.btnContent}>
                <Text style={GlobalStyles.buttonText}>BROADCAST SOS</Text>
                <View style={styles.btnIconCircle}>
                   <Text style={{color: COLORS.primaryDark, fontWeight: 'bold'}}>→</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 16, 
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
  
  pickerWrapper: { height: 50, justifyContent: 'center' },
  picker: { color: COLORS.primaryDark, marginLeft: -10 },

  textInputLarge: { 
    backgroundColor: COLORS.pureWhite, 
    borderRadius: 30, 
    padding: 20, 
    height: 180, 
    textAlignVertical: 'top', 
    fontSize: 16,
    color: COLORS.primaryDark,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },

  btnWrapper: { marginTop: 40, height: 75, borderRadius: 38, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', paddingHorizontal: 25 },
  btnContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnIconCircle: { 
    backgroundColor: COLORS.pureWhite, 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});

export default SOSForm;