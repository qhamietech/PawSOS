import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// --- AUTH & CORE SCREENS ---
import LoginScreen from '../screens/LoginScreen';

// --- OWNER SCREENS ---
import OwnerDashboard from '../screens/OwnerDashboard';
import OwnerRegister from '../screens/OwnerRegister';
import SOSForm from '../screens/SOSForm';

// --- VOLUNTEER SCREENS ---
import VolunteerRegister from '../screens/VolunteerRegister';
import VolunteerTierSelect from '../screens/VolunteerTierSelect';
import VolunteerDashboard from '../screens/VolunteerDashboard';

// --- SHARED SCREENS ---
import LiveCaseScreen from '../screens/LiveCaseScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EducationCenter from '../screens/EducationCenter';

const Stack = createStackNavigator();

/**
 * APP NAVIGATOR
 * Purpose: Handles top-level routing logic based on user authentication state.
 * Portfolio Note: Demonstrates implementation of protected routes and role-based navigation.
 */
export default function AppNavigator({ user, userRole }) {
  
  // 1. Dynamic Route Determination
  // This logic ensures the user lands on the correct dashboard immediately after Splash
  const getInitialRoute = () => {
    if (!user) return "Login"; // Default to Login if no active session
    return userRole === 'volunteer' ? "VolunteerDashboard" : "OwnerDashboard";
  };

  return (
    /* Note: independent={true} is used if this is a sub-navigator, 
       but for a portfolio, ensure your main App.js doesn't wrap this twice.
    */
    <NavigationContainer independent={true}>
      <Stack.Navigator 
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerStyle: { 
            backgroundColor: '#fff',
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
          },
          headerTintColor: '#1a1a2e',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitleVisible: false, // Cleaner look on iOS
        }}
      >
        {/* AUTHENTICATION FLOW */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* OWNER FLOW: Dedicated to pet owners requesting help */}
        <Stack.Screen 
          name="OwnerRegister" 
          component={OwnerRegister} 
          options={{ title: 'Create Owner Account' }} 
        />
        <Stack.Screen 
          name="OwnerDashboard" 
          component={OwnerDashboard} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="SOSForm" 
          component={SOSForm} 
          options={{ title: 'Report Emergency', headerBackTitle: 'Back' }} 
        />
        
        {/* VOLUNTEER FLOW: Dedicated to responders and vets */}
        <Stack.Screen 
          name="VolunteerRegister" 
          component={VolunteerRegister} 
          options={{ title: 'Join Rescue Team' }} 
        />
        <Stack.Screen 
          name="VolunteerTierSelect" 
          component={VolunteerTierSelect} 
          options={{ title: 'Verify Credentials' }} 
        />
        <Stack.Screen 
          name="VolunteerDashboard" 
          component={VolunteerDashboard} 
          options={{ headerShown: false }} 
        />
        
        {/* SHARED EMERGENCY & UTILITY SCREENS */}
        <Stack.Screen 
          name="LiveCaseScreen" 
          component={LiveCaseScreen} 
          options={{ title: 'Active Emergency', gestureEnabled: false }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'My Profile' }} 
        />
        <Stack.Screen 
          name="EducationCenter" 
          component={EducationCenter} 
          options={{ title: 'Vet Knowledge Base' }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}