import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserProvider } from './src/context/UserContext';
import ProfileSelectScreen from './src/screens/ProfileSelectScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddBankScreen from './src/screens/AddBankScreen';
import AccountScreen from './src/screens/AccountScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="ProfileSelect" screenOptions={{ headerTitleAlign: 'center' }}>
          <Stack.Screen name="ProfileSelect" component={ProfileSelectScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Controle Financeiro' }} />
          <Stack.Screen name="AddBank" component={AddBankScreen} options={{ title: 'Adicionar banco' }} />
          <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Conta' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
