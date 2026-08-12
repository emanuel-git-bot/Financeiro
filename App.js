import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import PicPayScreen from './src/screens/PicPayScreen';
import PagBankScreen from './src/screens/PagBankScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Controle Financeiro' }} />
        <Stack.Screen name="PicPay" component={PicPayScreen} options={{ title: 'PicPay' }} />
        <Stack.Screen name="PagBank" component={PagBankScreen} options={{ title: 'PagBank' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
