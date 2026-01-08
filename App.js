import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, View, Animated, StyleSheet, StatusBar, Image, Dimensions, Text } from 'react-native'; 
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'; 
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import * as SplashScreenNative from 'expo-splash-screen';

// --- BRAND PALETTE ---
const BRAND = {
  primaryDark: '#1a1a2e',
  accentCoral: '#FF6B6B',
  accentAmber: '#FFB86C',
  pureWhite: '#FFFFFF',
  ghostWhite: '#F8F9FA',
  successGreen: '#2ecc71',
};

const { width, height } = Dimensions.get('window');

// Import all your screens
import LoginScreen from './src/screens/LoginScreen';
import OwnerRegister from './src/screens/OwnerRegister';
import VolunteerRegister from './src/screens/VolunteerRegister';
import VolunteerTierSelect from './src/screens/VolunteerTierSelect'; 
import OwnerDashboard from './src/screens/OwnerDashboard';
import VolunteerDashboard from './src/screens/VolunteerDashboard';
import SOSForm from './src/screens/SOSForm'; 
import LiveCaseScreen from './src/screens/LiveCaseScreen';
import EducationCenter from './src/screens/EducationCenter';
import ProfileScreen from './src/screens/ProfileScreen';
import Leaderboard from './src/screens/Leaderboard';
import NearbyVets from './src/screens/NearbyVets'; // IMPORTED NEARBY VETS

// Keep native splash visible while loading
SplashScreenNative.preventAutoHideAsync();

// 1. CONFIGURE NOTIFICATION BEHAVIOR
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldVibrate: true, 
    shouldSetBadge: false,
  }),
});

// 2. CREATE NAVIGATION REF
export const navigationRef = createNavigationContainerRef();
const Stack = createStackNavigator();

// --- CUSTOM ANIMATED SPLASH COMPONENT ---
function CustomSplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current; 
  const floatAnim = useRef(new Animated.Value(0)).current;    
  const textPulseAnim = useRef(new Animated.Value(0.4)).current; 

  const [percent, setPercent] = useState(0);

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();

    // Subtle background float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Text pulsing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(textPulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(textPulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // 10-second Progress Bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10000,
      useNativeDriver: false, 
    }).start();

    // Update Percentage State
    const percentListener = progressAnim.addListener(({ value }) => {
      setPercent(Math.floor(value * 100));
    });

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 10000); 

    return () => {
      progressAnim.removeListener(percentListener);
      clearTimeout(timer);
    };
  }, [navigation, fadeAnim, scaleAnim]);

  // Total width of the progress bar container
  const CONTAINER_WIDTH = width * 0.75;

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CONTAINER_WIDTH],
  });

  const bgMove = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.ghostWhite} />
      
      {/* Background Decorative Elements */}
      <Animated.View style={[styles.bgPaw, { transform: [{ translateY: bgMove }], top: '12%', left: '10%' }]}>
        <Text style={styles.pawIcon}>🐾</Text>
      </Animated.View>
      <Animated.View style={[styles.bgPaw, { transform: [{ translateY: bgMove }], top: '40%', right: '8%' }]}>
        <Text style={styles.pawIcon}>🐾</Text>
      </Animated.View>
      <Animated.View style={[styles.bgPaw, { transform: [{ translateY: bgMove }], bottom: '25%', left: '15%' }]}>
        <Text style={styles.pawIcon}>🐾</Text>
      </Animated.View>

      <Animated.View style={{ 
        opacity: fadeAnim, 
        transform: [{ scale: scaleAnim }],
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.logoHero}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Thick Progress Section with Labels */}
      <View style={[styles.loaderWrapper, { width: CONTAINER_WIDTH }]}>
        <View style={styles.labelRow}>
           <Animated.Text 
             style={[
               styles.loadingText, 
               { opacity: percent === 100 ? 1 : textPulseAnim },
               percent === 100 && { color: BRAND.successGreen }
             ]}
           >
             {percent === 100 ? 'Rescue Ready!' : 'Preparing for rescue...'}
           </Animated.Text>
           <Text style={[styles.percentText, percent === 100 && { color: BRAND.successGreen }]}>
             {percent}%
           </Text>
        </View>

        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { width: barWidth },
              percent === 100 && { backgroundColor: BRAND.successGreen }
            ] } 
          />
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('emergency', {
            name: 'Emergency Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("SOS Alert Received:", notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const navigateToDashboard = () => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('VolunteerDashboard');
        } else {
          setTimeout(navigateToDashboard, 500);
        }
      };
      navigateToDashboard();
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreenNative.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View 
      style={{ flex: 1, backgroundColor: BRAND.ghostWhite }} 
      onLayout={onLayoutRootView}
    >
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false, 
            headerStyle: { backgroundColor: BRAND.ghostWhite },
            headerTitleStyle: { fontWeight: 'bold', color: BRAND.primaryDark },
            headerTintColor: BRAND.primaryDark,
          }}
        >
          <Stack.Screen name="Splash" component={CustomSplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="OwnerRegister" component={OwnerRegister} />
          <Stack.Screen name="VolunteerRegister" component={VolunteerRegister} />
          <Stack.Screen name="VolunteerTierSelect" component={VolunteerTierSelect} />
          <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
          <Stack.Screen name="VolunteerDashboard" component={VolunteerDashboard} />
          <Stack.Screen name="SOSForm" component={SOSForm} />
          <Stack.Screen name="LiveCaseScreen" component={LiveCaseScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EducationCenter" component={EducationCenter} />
          <Stack.Screen name="Leaderboard" component={Leaderboard} />
          {/* ADDED MISSING SCREEN REGISTRATION */}
          <Stack.Screen name="NearbyVets" component={NearbyVets} /> 
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND.ghostWhite,
  },
  logoHero: {
    width: width * 0.9,
    height: height * 0.8,
  },
  bgPaw: {
    position: 'absolute',
    opacity: 0.15, 
  },
  pawIcon: {
    fontSize: 70,
    color: BRAND.primaryDark,
  },
  loaderWrapper: {
    position: 'absolute',
    bottom: 80,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.primaryDark,
    letterSpacing: 0.5,
  },
  percentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.accentCoral,
  },
  progressContainer: {
    width: '100%',
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: BRAND.accentCoral,
    borderRadius: 20,
  }
});