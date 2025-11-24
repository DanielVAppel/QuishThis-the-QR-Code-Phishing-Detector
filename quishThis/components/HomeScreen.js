import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';

export default function HomeScreen({ onStartScanning }) {
  return (
    <ImageBackground
      source={require('../assets/minecraft-bg.png')}
      style={styles.background}
      resizeMode="repeat"
    >
      <View style={styles.overlay}>
        {/* Minecraft-style title */}
        <Text style={styles.title}>QuishThis</Text>

        {/* Green bubble subtitle */}
        <View style={styles.greenBubble}>
          <Text style={styles.bubbleText}>Protect yourself from malicious QR codes</Text>
        </View>

        {/* Shield button */}
        <TouchableOpacity onPress={onStartScanning} activeOpacity={0.8}>
          <Image source={require('../assets/shield.png')} style={styles.image} />
        </TouchableOpacity>

        {/* Green bubble tap hint */}
        <View style={styles.greenBubble}>
          <Text style={styles.bubbleText}>Tap the shield to protect yourself</Text>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>QR codes can be dangerous:</Text>
          <Text style={styles.infoText}>They might lead to:</Text>
          <Text style={styles.bullet}>🧪 Phishing websites</Text>
          <Text style={styles.bullet}>🧟 Malware downloads</Text>
          <Text style={styles.bullet}>🧾 Personal data theft</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'green',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    marginTop: 60,
    fontFamily: 'Minecraftia', // ✅ Minecraft-style font!
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    letterSpacing: 1,
  },
  greenBubble: {
    backgroundColor: '#00cc44',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Minecraftia',
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginVertical: 20,
  },
  infoBox: {
    backgroundColor: '#4e3b24cc',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#3a2b1a',
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
    marginBottom: 6,
  },
});
