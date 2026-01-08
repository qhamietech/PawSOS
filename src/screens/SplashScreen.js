import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/theme'; // Using COLORS to match your previous screens

const { width } = Dimensions.get('window');

/**
 * SPLASH SCREEN
 * Purpose: Initial brand presentation and asset pre-loading.
 * Highlights: Dual-animation sequence (Fade & Scale) using the Animated API's native driver.
 */
const SplashScreen = ({ navigation }) => {
  // 1. ANIMATION CONSTANTS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Start slightly smaller

  useEffect(() => {
    // 2. RUN ANIMATIONS IN PARALLEL
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 10,
        useNativeDriver: true,
      })
    ]).start();

    // 3. NAVIGATION LOGIC
    // Wait 3 seconds to ensure brand recognition, then move to Auth stack
    const timer = setTimeout(() => {
      navigation.replace('Login'); 
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Light content looks best on dark brand gradients */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient 
        colors={[COLORS.primaryDark, '#121225']} 
        style={styles.gradient}
      >
        <Animated.View 
          style={{ 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }],
            alignItems: 'center' 
          }}
        >
          {/* Logo Container */}
          <View style={styles.logoCircle}>
             <Text style={styles.emoji}>🐾</Text>
          </View>

          {/* Brand Name */}
          <Text style={styles.title}>
            Paw<Text style={{color: COLORS.accentCoral || '#FF7F50'}}>SOS</Text>
          </Text>
          
          <Text style={styles.tagline}>Emergency Pet Network</Text>
        </Animated.View>

        {/* Subtle Footer */}
        <View style={styles.footer}>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  gradient: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logoCircle: {
    width: 140, 
    height: 140, 
    borderRadius: 70,
    backgroundColor: '#FFF',
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    // Add shadow/elevation for a "floating" look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: { 
    fontSize: 70 
  },
  title: { 
    fontSize: 48, 
    fontWeight: '900', 
    color: '#FFF',
    letterSpacing: -1
  },
  tagline: {
    color: '#FFF',
    opacity: 0.6,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center'
  },
  version: {
    color: '#FFF',
    opacity: 0.3,
    fontSize: 12,
    fontWeight: 'bold'
  }
});

export default SplashScreen;