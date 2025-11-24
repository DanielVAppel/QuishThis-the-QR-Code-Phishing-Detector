// components/SafetyResults.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';

/**
 * SafetyResults Component - Displays the safety analysis results of a scanned QR code
 * @param {object} props - Component props
 * @param {string} props.data - The raw data from the QR code
 * @param {object} props.results - Safety check results
 * @param {function} props.onScanAgain - Function to reset scanner and scan again
 * @param {function} props.onExit - Function to exit scanner mode
 */
export default function SafetyResults({ data, results, onScanAgain, onExit }) {
  /**
   * Handle opening the URL if the user chooses to proceed
   */
  const handleOpenUrl = async () => {
    if (results.isUrl && await Linking.canOpenURL(data)) {
      await Linking.openURL(data);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Results</Text>
      </View>
      <ScrollView style={styles.contentContainer}>
        {/* Status indicator */}
        <View style={[
          styles.statusContainer,
          results.safe ? styles.safeStatus : styles.dangerStatus
        ]}>
          <Text style={styles.statusText}>
            {results.safe ? 'SAFE' : 'CAUTION'}
          </Text>
        </View>

        {/* QR Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code Content:</Text>
          <Text style={styles.contentText} selectable={true}>{data}</Text>

          {/* Show if URL was shortened */}
          {results.wasShortened && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>URL Shortened Detected!</Text>
              <Text style={styles.warningText}>
                This was a shortened URL that was expanded for safety checking.
              </Text>
              <Text style={styles.contentText} selectable={true}>
                Original: {results.originalUrl}
              </Text>
              <Text style={styles.contentText} selectable={true}>
                Expanded: {results.expandedUrl}
              </Text>
            </View>
          )}
        </View>

        {/* Safety Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Analysis:</Text>
          {results.isUrl ? (
            <>
              {/* HTTPS Status */}
              <View style={styles.checkItem}>
                <View style={[
                  styles.checkIndicator,
                  results.https ? styles.checkPass : styles.checkFail
                ]} />
                <View style={styles.checkTextContainer}>
                  <Text style={styles.checkTitle}>HTTPS Secure Connection</Text>
                  <Text style={styles.checkDescription}>
                    {results.https
                      ? 'This website uses secure HTTPS encryption.'
                      : 'This website does not use secure HTTPS encryption.'}
                  </Text>
                </View>
              </View>

              {/* SSL/TLS Status */}
              <View style={styles.checkItem}>
                <View style={[
                  styles.checkIndicator,
                  results.validCert ? styles.checkPass : styles.checkFail
                ]} />
                <View style={styles.checkTextContainer}>
                  <Text style={styles.checkTitle}>SSL/TLS Certificate</Text>
                  <Text style={styles.checkDescription}>
                    {results.validCert
                      ? 'Website has a valid security certificate.'
                      : 'Could not verify website security certificate.'}
                  </Text>
                </View>
              </View>

              {/* Malicious Content Status */}
              <View style={styles.checkItem}>
                <View style={[
                  styles.checkIndicator,
                  results.maliciousCheck ? styles.checkFail : styles.checkPass
                ]} />
                <View style={styles.checkTextContainer}>
                  <Text style={styles.checkTitle}>Malicious Content Check</Text>
                  <Text style={styles.checkDescription}>
                    {results.maliciousCheck
                      ? 'This URL may contain malicious content.'
                      : 'No known threats detected.'}
                  </Text>
                </View>
              </View>

              {/* Domain Reputation - NEW */}
              {results.domainReputation && (
                <View style={styles.checkItem}>
                  <View style={[
                    styles.checkIndicator,
                    results.domainReputation.score >= 50 ? styles.checkPass : styles.checkFail
                  ]} />
                  <View style={styles.checkTextContainer}>
                    <Text style={styles.checkTitle}>Domain Reputation</Text>
                    <Text style={styles.checkDescription}>
                      {results.domainReputation.score >= 70
                        ? 'This domain appears to be reputable.'
                        : results.domainReputation.score >= 40
                          ? 'This domain has moderate reputation.'
                          : 'This domain has poor reputation.'}
                    </Text>
                    {results.domainReputation.details.map((detail, index) => (
                      <Text key={index} style={styles.detailText}>{detail}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Typosquatting Check - NEW */}
              {results.typosquatting && results.typosquatting.suspicious && (
                <View style={styles.checkItem}>
                  <View style={[styles.checkIndicator, styles.checkFail]} />
                  <View style={styles.checkTextContainer}>
                    <Text style={styles.checkTitle}>Typosquatting Warning</Text>
                    <Text style={styles.checkDescription}>
                      This domain appears similar to {results.typosquatting.similarTo}.
                      It may be attempting to mimic a legitimate website.
                    </Text>
                  </View>
                </View>
              )}

              {/* Malicious Pattern Detection - NEW */}
              {results.maliciousPatterns && results.maliciousPatterns.patterns.length > 0 && (
                <View style={styles.checkItem}>
                  <View style={[
                    styles.checkIndicator,
                    results.maliciousPatterns.score > 30 ? styles.checkFail : styles.checkWarning
                  ]} />
                  <View style={styles.checkTextContainer}>
                    <Text style={styles.checkTitle}>Suspicious Patterns</Text>
                    <Text style={styles.checkDescription}>
                      This URL contains patterns often found in malicious links:
                    </Text>
                    {results.maliciousPatterns.patterns.map((pattern, index) => (
                      <Text key={index} style={styles.detailText}>• {pattern}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Domain Age/Reputation if available */}
              {results.domainInfo && (
                <View style={styles.checkItem}>
                  <View style={styles.checkIndicator} />
                  <View style={styles.checkTextContainer}>
                    <Text style={styles.checkTitle}>Domain Information</Text>
                    <Text style={styles.checkDescription}>{results.domainInfo}</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.contentText}>{results.details}</Text>
          )}
        </View>

        {/* Recommendation */}
        <View style={[
          styles.recommendationContainer,
          results.safe ? styles.safeRecommendation : styles.dangerRecommendation
        ]}>
          <Text style={styles.recommendationTitle}>Recommendation:</Text>
          <Text style={styles.recommendationText}>
            {results.safe
              ? 'This appears to be safe to open.'
              : 'Exercise caution before proceeding.'}
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onScanAgain}>
          <Text style={styles.secondaryButtonText}>Scan Another</Text>
        </TouchableOpacity>
        {results.isUrl && (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !results.safe && styles.warningButton
            ]}
            onPress={handleOpenUrl}
          >
            <Text style={styles.primaryButtonText}>
              {results.safe ? 'Open URL' : 'Proceed Anyway'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>Exit Scanner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    backgroundColor: '#2c6bed',
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  safeStatus: {
    backgroundColor: '#4CAF50',
  },
  dangerStatus: {
    backgroundColor: '#FF5722',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c6bed',
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  checkItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  checkIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
    marginTop: 5,
  },
  checkPass: {
    backgroundColor: '#4CAF50',
  },
  checkFail: {
    backgroundColor: '#FF5722',
  },
  checkWarning: {
    backgroundColor: '#ffc107',
  },
  checkTextContainer: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  checkDescription: {
    fontSize: 14,
    color: '#555',
  },
  recommendationContainer: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  safeRecommendation: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  dangerRecommendation: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderColor: '#FF5722',
    borderWidth: 1,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonsContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  primaryButton: {
    backgroundColor: '#2c6bed',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  warningButton: {
    backgroundColor: '#FF5722',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#e1e1e1',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  exitButton: {
    borderWidth: 1,
    borderColor: '#999',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#555',
    fontSize: 16,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginLeft: 5,
  },
});