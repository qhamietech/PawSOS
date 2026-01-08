import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND } from '../styles/theme';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Logic: Wait 3 seconds, then move to Login
    const timer = setTimeout(() => {
      navigation.replace('Login'); 
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[BRAND.primaryDark, '#121225']} style={styles.gradient}>
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <View style={styles.logoCircle}>
             <Text style={{fontSize: 60}}>🐾</Text>
          </View>
          <Text style={styles.title}>Paw<Text style={{color: BRAND.accentCoral}}>SOS</Text></Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: BRAND.pureWhite,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 40, fontWeight: '900', color: BRAND.pureWhite },
});

export default SplashScreen;