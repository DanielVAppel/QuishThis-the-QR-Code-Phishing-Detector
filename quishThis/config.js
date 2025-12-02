// config.js - Centralized API configuration
// Store your API keys here or use environment variables in production

export const API_CONFIG = {
  // Google Safe Browsing API
  // Get your key at: https://developers.google.com/safe-browsing/v4/get-started
  GOOGLE_SAFE_BROWSING_KEY: 'YOUR_GOOGLE_SAFE_BROWSING_API_KEY',
  
  // WHOIS API (WhoisXMLAPI recommended)
  // Get your key at: https://whoisxmlapi.com/
  WHOIS_API_KEY: 'YOUR_WHOIS_API_KEY',
  
  // VirusTotal API for typosquatting and URL reputation
  // Get your key at: https://www.virustotal.com/
  VIRUS_TOTAL_API_KEY: 'YOUR_VIRUSTOTAL_API_KEY',
  
  // URLScan.io API for comprehensive URL analysis
  // Get your key at: https://urlscan.io/
  URLSCAN_API_KEY: 'YOUR_URLSCAN_API_KEY',
  
  // Server endpoint (update if deploying to cloud)
  SERVER_URL: 'http://localhost:3000',
  
  // PhishTank API (optional, no key required but has rate limits)
  PHISHTANK_API_KEY: 'YOUR_PHISHTANK_API_KEY', // Optional
  
  // SSL Labs API (no key required, but rate limited)
  SSL_LABS_API_URL: 'https://api.ssllabs.com/api/v3/',
  
  // Reporting endpoints
  REPORT_ENDPOINTS: {
    // Google Safe Browsing submission (for reporting phishing)
    GOOGLE_SAFE_BROWSING: 'https://safebrowsing.google.com/safebrowsing/report_phish/',
    // PhishTank submission
    PHISHTANK: 'https://www.phishtank.com/add_web_phish.php',
    // Custom backend for internal tracking
    CUSTOM_BACKEND: 'YOUR_CUSTOM_BACKEND_URL'
  }
};

// Development mode flag
export const IS_DEVELOPMENT = __DEV__;

// Cache configuration
export const CACHE_CONFIG = {
  ENABLED: true,
  TTL: 3600000, // 1 hour in milliseconds
  MAX_SIZE: 100 // Maximum number of cached entries
};