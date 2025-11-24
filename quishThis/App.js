import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera } from 'expo-camera';
import { useFonts } from 'expo-font';
import HomeScreen from './components/HomeScreen';
import QRScanner from './components/QRScanner';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');

  // Load the Minecraft font
  const [fontsLoaded] = useFonts({
    Minecraftia: require('./assets/fonts/Minecraftia-Regular.ttf'),
  });

  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle starting the QR scanner
  const handleStartScanning = () => {
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

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied.</Text>
        <Text style={styles.subText}>
          QR Scanner needs camera access to scan QR codes.
        </Text>
      </View>
    );
  }

  // Render the current screen
  return (
    <>
      {currentScreen === 'home' ? (
        <HomeScreen onStartScanning={handleStartScanning} />
      ) : (
        <QRScanner onExitScanner={handleExitScanner} />
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