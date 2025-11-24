//scanner component
// components/QRScanner.js
// components/QRScanner.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { checkUrlSafety } from '../utils/urlChecker';
import SafetyResults from './SafetyResults';

/**
 * QRScanner Component - Handles the QR code scanning functionality
 * @param {object} props - Component props
 * @param {function} props.onExitScanner - Function to call when exiting scanner mode
 */
export default function QRScanner({ onExitScanner }) {
  // Permission state
  const [hasPermission, setHasPermission] = useState(null);
  
  // Scanning states
  const [scanned, setScanned] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Scanned data states
  const [scannedData, setScannedData] = useState(null);
  const [safetyResults, setSafetyResults] = useState(null);
  
  // Reference to prevent multiple simultaneous scans
  const isProcessingRef = useRef(false);
  
  // Camera reference
  const cameraRef = useRef(null);

  // Request camera permission on component mount
  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    
    getPermission();
  }, []);

  /**
   * Handle QR code scan event
   * @param {object} result - Scan result containing type and data
   */
  const handleBarCodeScanned = async ({ type, data }) => {
    // Prevent multiple simultaneous scan processing
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    // Set the scanned flag to prevent multiple scans
    setScanned(true);
    setScannedData(data);
    
    // Check if the data appears to be a URL
    if (data.startsWith('http://') || data.startsWith('https://')) {
      // Set checking state to show loading indicator
      setIsChecking(true);
      
      try {
        // Perform safety checks on the URL
        const results = await checkUrlSafety(data);
        setSafetyResults(results);
      } catch (error) {
        console.error('Error checking URL:', error);
        Alert.alert(
          'Error',
          'Failed to check URL safety. Please try again.',
          [{ text: 'OK', onPress: () => resetScanner() }]
        );
      } finally {
        setIsChecking(false);
        isProcessingRef.current = false;
      }
    } else {
      // If it's not a URL, just show the text content
      setSafetyResults({
        isUrl: false,
        content: data,
        safe: true, // Non-URLs are considered safe
        details: 'This QR code contains text content, not a URL.'
      });
      isProcessingRef.current = false;
    }
  };

  /**
   * Reset the scanner to scan another QR code
   */
  const resetScanner = () => {
    setScanned(false);
    setScannedData(null);
    setSafetyResults(null);
    // Give a small delay before allowing new scans
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1000);
  };

  // Handle different permission states
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission denied.</Text>
        <Text style={styles.permissionSubtext}>
          QR Scanner needs camera access to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onExitScanner}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If we have results to show, display the Results component
  if (safetyResults) {
    return (
      <SafetyResults 
        data={scannedData}
        results={safetyResults}
        onScanAgain={resetScanner}
        onExit={onExitScanner}
      />
    );
  }

  // Main scanner view
  return (
    <View style={styles.container}>
      {/* Camera view that scans QR codes */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        ref={cameraRef}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Scanning frame overlay */}
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningFrame}>
            <View style={[styles.cornerTL, styles.corner]} />
            <View style={[styles.cornerTR, styles.corner]} />
            <View style={[styles.cornerBL, styles.corner]} />
            <View style={[styles.cornerBR, styles.corner]} />
          </View>
          
          <Text style={styles.instructionText}>
            Position QR code inside the frame
          </Text>
        </View>
        
        {/* Checking indicator */}
        {isChecking && (
          <View style={styles.checkingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.checkingText}>Analyzing QR code safety...</Text>
          </View>
        )}
        
        {/* Bottom controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.exitButton} 
            onPress={onExitScanner}
          >
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
          
          {scanned && !isChecking && (
            <TouchableOpacity 
              style={styles.scanAgainButton} 
              onPress={resetScanner}
            >
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
  },
  permissionSubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginHorizontal: 40,
    marginBottom: 30,
  },
  scanningOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 4,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 15,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 15,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 15,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 15,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  checkingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkingText: {
    color: 'white',
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    margin: 10,
  },
  exitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  scanAgainButton: {
    backgroundColor: '#2c6bed',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    margin: 10,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2c6bed',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});