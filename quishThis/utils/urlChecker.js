// utils/urlChecker.js - Main orchestrator for URL checking
// Reduced from 400+ lines to ~80 lines using Strategy Pattern
import { urlAnalyzer } from './urlAnalyzer';
import {
  SafeBrowsingStrategy,
  URLExpansionStrategy,
  DomainReputationStrategy,
  SSLValidationStrategy,
  TyposquattingStrategy,
  PhishingPatternStrategy
} from './analysisStrategies';

/**
 * Initialize URL analyzer with all strategies
 * This replaces the previous 400+ line monolithic approach
 */
function initializeAnalyzer() {
  // Register all analysis strategies
  urlAnalyzer.registerStrategy(new SafeBrowsingStrategy());
  urlAnalyzer.registerStrategy(new URLExpansionStrategy());
  urlAnalyzer.registerStrategy(new DomainReputationStrategy());
  urlAnalyzer.registerStrategy(new SSLValidationStrategy());
  urlAnalyzer.registerStrategy(new TyposquattingStrategy());
  urlAnalyzer.registerStrategy(new PhishingPatternStrategy());
}

// Initialize on module load
initializeAnalyzer();

/**
 * Main function to check URL safety
 * Simplified interface for the rest of the application
 * @param {string} url - URL to analyze
 * @returns {Promise<object>} Analysis results
 */
export async function checkUrlSafety(url) {
  try {
    // Validate URL format
    if (!isValidURL(url)) {
      return {
        error: 'Invalid URL format',
        url,
        isValid: false,
        safe: false
      };
    }

    // Perform comprehensive analysis using all registered strategies
    const results = await urlAnalyzer.analyze(url);
    
    // Map to legacy format for backward compatibility
    return {
      ...results,
      isValid: true,
      safe: results.overallSafety === 'safe' || results.overallSafety === 'caution',
      isUrl: true,
      https: url.startsWith('https://'),
      // Map new structure to old structure for SafetyResults component
      domainReputation: results.checks.domainReputation,
      typosquatting: results.checks.typosquatting,
      maliciousPatterns: results.checks.phishingPattern,
      validCert: results.checks.ssl?.validCert,
      maliciousCheck: results.checks.safeBrowsing?.isSafe === false,
      wasShortened: results.checks.urlExpansion?.isShortened,
      originalUrl: results.checks.urlExpansion?.original,
      expandedUrl: results.checks.urlExpansion?.expanded,
      checkedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('URL checking error:', error);
    return {
      error: error.message,
      url,
      isValid: false,
      safe: false,
      overallSafety: 'unknown'
    };
  }
}

/**
 * Quick safety check (subset of checks for faster results)
 * Useful for initial QR scan feedback
 * @param {string} url - URL to check
 * @returns {Promise<object>} Quick analysis results
 */
export async function quickSafetyCheck(url) {
  try {
    if (!isValidURL(url)) {
      return { safe: false, reason: 'Invalid URL' };
    }

    // Only run critical checks
    const phishingStrategy = new PhishingPatternStrategy();
    const sslStrategy = new SSLValidationStrategy();

    const [phishingResult, sslResult] = await Promise.all([
      phishingStrategy.analyze(url),
      sslStrategy.analyze(url)
    ]);

    const safe = !phishingResult.isPhishing && sslResult.hasSSL !== false;

    return {
      safe,
      phishing: phishingResult,
      ssl: sslResult,
      reason: !safe ? 'Security concerns detected' : 'Initial checks passed'
    };

  } catch (error) {
    return {
      safe: false,
      reason: error.message
    };
  }
}

/**
 * Validate URL format
 * @param {string} urlString - URL string to validate
 * @returns {boolean} True if valid URL
 */
function isValidURL(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string|null} Domain name or null if invalid
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Parse QR code data and extract URL
 * Handles various QR code formats
 * @param {string} qrData - Raw QR code data
 * @returns {string} Extracted URL or original data
 */
export function parseQRData(qrData) {
  // Check if it's already a URL
  if (isValidURL(qrData)) {
    return qrData;
  }

  // Try to extract URL from common QR formats
  // Format: URL:http://example.com
  if (qrData.startsWith('URL:') || qrData.startsWith('url:')) {
    const extractedURL = qrData.substring(4);
    if (isValidURL(extractedURL)) {
      return extractedURL;
    }
  }

  // Format: URLTO:http://example.com
  if (qrData.startsWith('URLTO:')) {
    const extractedURL = qrData.substring(6);
    if (isValidURL(extractedURL)) {
      return extractedURL;
    }
  }

  // Try to find URL within text
  const urlMatch = qrData.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  return qrData; // Return as-is if no URL found
}

/**
 * Clear analysis cache
 * Useful for testing or memory management
 */
export function clearCache() {
  urlAnalyzer.clearCache();
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
export function getCacheStats() {
  return urlAnalyzer.getCacheStats();
}

/**
 * Get cached result if available
 * @param {string} url - URL to check cache for
 * @returns {object|null} Cached result or null
 */
export function getCachedResult(url) {
  const cacheKey = urlAnalyzer.generateCacheKey(url);
  const cached = urlAnalyzer.cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }
  
  return null;
}

// Export default object for convenience
export default {
  checkUrlSafety,
  quickSafetyCheck,
  extractDomain,
  parseQRData,
  clearCache,
  getCacheStats,
  getCachedResult
};