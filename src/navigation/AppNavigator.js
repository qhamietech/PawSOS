import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import WelcomeScreen from '../screens/WelcomeScreen';
import OwnerDashboard from '../screens/OwnerDashboard';
import OwnerRegister from '../screens/OwnerRegister';
import VolunteerRegister from '../screens/VolunteerRegister';
import VolunteerDashboard from '../screens/VolunteerDashboard';
import LiveCaseScreen from '../screens/LiveCaseScreen';
import LoginScreen from '../screens/LoginScreen'; // Import the new screen

const Stack = createStackNavigator();

export default function AppNavigator({ user, userRole }) {
  // Determine the starting screen based on Auth state
  const getInitialRoute = () => {
    if (!user) return "Welcome";
    return userRole === 'volunteer' ? "VolunteerDashboard" : "OwnerDashboard";
  };

  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator 
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#2d3436',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        
        {/* Owner Flow */}
        <Stack.Screen name="OwnerRegister" component={OwnerRegister} options={{ title: 'Owner Signup' }} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} options={{ title: 'Pet Owner SOS' }} />
        
        {/* Volunteer Flow */}
        <Stack.Screen name="VolunteerRegister" component={VolunteerRegister} options={{ title: 'Volunteer Signup' }} />
        <Stack.Screen name="VolunteerDashboard" component={VolunteerDashboard} options={{ title: 'Available Cases' }} />
        
        {/* Shared */}
        <Stack.Screen name="LiveCaseScreen" component={LiveCaseScreen} options={{ title: 'Active Emergency' }} />

      
         <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In' }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}