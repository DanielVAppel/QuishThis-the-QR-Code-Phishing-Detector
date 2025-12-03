import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import HomeScreen from './components/HomeScreen';
import QRScanner from './components/QRScanner';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [permission, requestPermission] = useCameraPermissions();

  // Load the Minecraft font
  const [fontsLoaded] = useFonts({
    Minecraftia: require('./assets/fonts/Minecraftia-Regular.ttf'),
  });

  // Handle starting the QR scanner
  const handleStartScanning = async () => {
    // Request permission if not granted
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return; // Permission denied
      }
    }
    setCurrentScreen('scanner');
  };

  // Handle exiting the scanner and returning to home
  const handleExitScanner = () => {
    setCurrentScreen('home');
  };

  // Loading state while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Render the current screen
  return (
    <>
      {currentScreen === 'home' ? (
        <HomeScreen onStartScanning={handleStartScanning} />
      ) : (
        <QRScanner 
          onExitScanner={handleExitScanner}
          hasPermission={permission?.granted}
          requestPermission={requestPermission}
        />
      )}
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f1f6f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f6f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  }
});