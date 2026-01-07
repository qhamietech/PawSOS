import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logoText}>PawSOS</Text>
          <Text style={styles.tagline}>Emergency assistance for pets.</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.ownerBtn]} 
            onPress={() => navigation.navigate('OwnerRegister')}
          >
            <Text style={styles.buttonText}>I AM A PET OWNER</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.volunteerBtn]} 
            onPress={() => navigation.navigate('VolunteerRegister')}
          >
            <Text style={styles.buttonText}>I AM A VOLUNTEER</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginLink} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 60 },
  logoText: { fontSize: 42, fontWeight: 'bold', color: '#d63031' },
  tagline: { fontSize: 16, color: '#636e72', marginTop: 10 },
  buttonContainer: { width: '100%' },
  button: { width: '100%', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  ownerBtn: { backgroundColor: '#d63031' },
  volunteerBtn: { backgroundColor: '#2ecc71' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginLink: { marginTop: 10, alignItems: 'center' },
  loginLinkText: { color: '#636e72', fontSize: 16, fontWeight: '600' }
});

export default WelcomeScreen;