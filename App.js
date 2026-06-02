import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import SimulationListScreen from './src/screens/SimulationListScreen';
import SimulationViewScreen from './src/screens/SimulationViewScreen';
import AdminScreen from './src/screens/AdminScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#1e40af' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
            cardStyle: { backgroundColor: '#f8fafc' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'NJ Learning Hub', headerLeft: null }}
          />
          <Stack.Screen
            name="SimulationList"
            component={SimulationListScreen}
            options={{ title: 'Simulations' }}
          />
          <Stack.Screen
            name="SimulationView"
            component={SimulationViewScreen}
            options={({ route }) => ({ title: route.params?.title || 'Simulation' })}
          />
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{ title: 'Admin Panel' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
