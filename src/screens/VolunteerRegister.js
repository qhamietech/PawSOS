import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const VolunteerRegistration = ({ navigation }) => {
  const [tier, setTier] = useState('student');
  const [name, setName] = useState('');

  const tiers = [
    { id: 'student', title: 'Student', desc: 'Low Severity', emoji: '🎓' },
    { id: 'graduate', title: 'Graduate', desc: 'Mid Severity', emoji: '📜' },
    { id: 'qualified', title: 'Expert', desc: 'All Cases', emoji: '🩺' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER - Inspired by the "Hi, Andry" screen */}
        <View style={styles.headerSection}>
          <Text style={styles.brandTitle}>PawSOS</Text>
          <Text style={styles.mainHeading}>Join the{'\n'}Rescue Team</Text>
        </View>

        {/* INPUT SECTION - Clean & Minimal */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Dr. Jane Doe"
            placeholderTextColor="#95a5a6"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* TIER SELECTION - Inspired by the circular pet cards */}
        <Text style={styles.sectionTitle}>Choose your Qualification</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierScroll}>
          {tiers.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => setTier(item.id)}
              style={[styles.tierCard, tier === item.id && styles.activeTier]}
            >
              <View style={[styles.circle, tier === item.id ? styles.activeCircle : styles.inactiveCircle]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <Text style={[styles.tierTitle, tier === item.id && styles.activeText]}>{item.title}</Text>
              <Text style={styles.tierDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FOOTER ACTION - Inspired by the "Adoption" button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.mainBtn} onPress={() => Alert.alert("Registering...")}>
            <LinearGradient 
              colors={['#1A1A1A', '#333333']} 
              style={styles.gradientBtn}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <Text style={styles.btnText}>Complete Profile</Text>
              <View style={styles.btnIconCircle}>
                <Text style={{color: '#000', fontWeight: 'bold'}}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#A8E6CF' }, // That mint color from your image
  scrollContent: { padding: 25 },
  headerSection: { marginTop: 40, marginBottom: 30 },
  brandTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 2, color: '#1A1A1A', marginBottom: 10 },
  mainHeading: { fontSize: 38, fontWeight: '900', color: '#1A1A1A', lineHeight: 42 },
  
  inputCard: { backgroundColor: '#fff', padding: 20, borderRadius: 25, marginBottom: 30 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: '#bdc3c7', letterSpacing: 1, marginBottom: 8 },
  input: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },
  tierScroll: { marginHorizontal: -25, paddingLeft: 25 },
  tierCard: { 
    backgroundColor: '#fff', 
    width: width * 0.4, 
    padding: 20, 
    borderRadius: 30, 
    marginRight: 15,
    alignItems: 'center',
    marginBottom: 20
  },
  activeTier: { backgroundColor: '#1A1A1A' },
  circle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  inactiveCircle: { backgroundColor: '#f1f2f6' },
  activeCircle: { backgroundColor: '#333' },
  emoji: { fontSize: 30 },
  tierTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  tierDesc: { fontSize: 12, color: '#95a5a6', marginTop: 4 },
  activeText: { color: '#fff' },

  footer: { marginTop: 20 },
  mainBtn: { borderRadius: 40, overflow: 'hidden', height: 70 },
  gradientBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnIconCircle: { backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
});

export default VolunteerRegistration;