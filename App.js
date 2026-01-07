import React, { useEffect, useState, useCallback } from 'react';
import { Platform, View } from 'react-native'; 
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'; 
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';

// Import all your screens
import LoginScreen from './src/screens/LoginScreen';
import OwnerRegister from './src/screens/OwnerRegister';
import VolunteerRegister from './src/screens/VolunteerRegister';
import OwnerDashboard from './src/screens/OwnerDashboard';
import VolunteerDashboard from './src/screens/VolunteerDashboard';
import SOSForm from './src/screens/SOSForm'; 
import LiveCaseScreen from './src/screens/LiveCaseScreen';
import EducationCenter from './src/screens/EducationCenter';
import ProfileScreen from './src/screens/ProfileScreen';
import Leaderboard from './src/screens/Leaderboard';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // 3. CONFIGURE ANDROID CHANNEL
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('emergency', {
            name: 'Emergency Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        // Artificial delay to show logo/assets
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    // Notification Listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("SOS Alert Received while app open:", notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("User tapped notification:", response.notification.request.content.data);
      
      const navigateToDashboard = () => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('VolunteerDashboard');
        } else {
          // Retry if navigation isn't ready yet
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

  // 4. HIDE SPLASH SCREEN WHEN APP IS READY
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View 
      style={{ flex: 1, backgroundColor: '#d63031' }} 
      onLayout={onLayoutRootView}
    >
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: '#f8f9fa' },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OwnerRegister" component={OwnerRegister} options={{ title: 'Create Owner Account' }} />
          <Stack.Screen name="VolunteerRegister" component={VolunteerRegister} options={{ title: 'Join as Volunteer' }} />

          {/* Dashboards */}
          <Stack.Screen 
            name="OwnerDashboard" 
            component={OwnerDashboard} 
            options={{ 
              headerLeft: () => null, 
              gestureEnabled: false,
              title: 'Pet Owner Portal'
            }} 
          />
          <Stack.Screen 
            name="VolunteerDashboard" 
            component={VolunteerDashboard} 
            options={{ 
              headerLeft: () => null, 
              gestureEnabled: false,
              title: 'Responder Portal'
            }} 
          />

          {/* Feature Screens */}
          <Stack.Screen 
            name="SOSForm" 
            component={SOSForm} 
            options={{ title: 'Emergency Details', headerTintColor: '#d63031' }} 
          />
          <Stack.Screen 
            name="LiveCaseScreen" 
            component={LiveCaseScreen} 
            options={{ title: 'Medical Clipboard', headerLeft: () => null }} 
          />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          <Stack.Screen name="EducationCenter" component={EducationCenter} options={{ title: 'First Aid Guides' }} />
          <Stack.Screen name="Leaderboard" component={Leaderboard} options={{ title: 'Top Responders' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}