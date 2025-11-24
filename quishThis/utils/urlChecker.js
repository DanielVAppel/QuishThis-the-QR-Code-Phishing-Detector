//URL safety checking functions
// utils/urlChecker.js
// Add these functions to utils/urlChecker.js

import 'react-native-url-polyfill/auto';
import axios from 'axios';

// Function 1: URL shortener detection and expansion
async function expandShortUrl(url) {
  // Common URL shortener domains
  const shortenerDomains = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'youtu.be', 'ow.ly',
    'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'tiny.cc', 'shorturl.at'
  ];

  try {
    const urlObj = new URL(url);
    const isShortened = shortenerDomains.some(domain =>
      urlObj.hostname.toLowerCase().includes(domain.toLowerCase())
    );

    if (!isShortened) {
      return url; // Not a shortened URL
    }

    // Make a HEAD request to follow redirects without downloading content
    const response = await axios.head(url, {
      maxRedirects: 5,
      validateStatus: null, // Accept all status codes to handle unusual responses
      timeout: 5000 // 5 second timeout
    });

    // If there's a redirect, get the final URL
    if (response.request && response.request.res && response.request.res.responseUrl) {
      return response.request.res.responseUrl;
    }

    return url; // No redirect found or couldn't determine
  } catch (error) {
    console.error('Error expanding shortened URL:', error);
    return url; // Return original URL on error
  }
}

// Function 2: Domain reputation checking
// Helper function to extract root domain
function extractRootDomain(domain) {
  const parts = domain.split('.');
  if (parts.length > 2) {
    // Handle special cases like co.uk
    if (parts[parts.length - 2] === 'co' || parts[parts.length - 2] === 'com') {
      return `${parts[parts.length - 3]}.${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  }
  return domain;
}

async function checkDomainReputation(domain) {
  try {
    const reputation = {
      score: 0, // 0-100, higher is better
      knownBad: false,
      knownGood: false,
      ageSignal: null,
      details: []
    };

    // Check against list of known trusted domains
    const trustedDomains = ['google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'github.com'];
    const isTrustedRoot = trustedDomains.some(trusted => {
      const rootDomain = extractRootDomain(domain);
      return rootDomain === trusted;
    });

    if (isTrustedRoot) {
      reputation.knownGood = true;
      reputation.score = 90;
      reputation.details.push('Domain is from a trusted provider');
    }

    // Check domain age using WHOIS (would require server-side API)
    // This is just a placeholder - in real implementation you'd call a WHOIS API
    // For demo purposes: check if domain has common TLDs or suspicious TLDs
    const suspiciousTlds = ['.xyz', '.top', '.club', '.online', '.info'];
    const hasWeirdTld = suspiciousTlds.some(tld => domain.endsWith(tld));
    if (hasWeirdTld) {
      reputation.score -= 20;
      reputation.details.push('Domain uses an uncommon TLD');
    }

    // Return the reputation object
    return reputation;
  } catch (error) {
    console.error('Error checking domain reputation:', error);
    return { score: 50, details: ['Unable to check reputation'] };
  }
}

// Function 3: Typosquatting detection
function checkForTyposquatting(domain) {
  // List of popular domains that might be typosquatted
  const popularDomains = [
    'google.com', 'facebook.com', 'amazon.com', 'apple.com', 'netflix.com',
    'microsoft.com', 'gmail.com', 'yahoo.com', 'instagram.com', 'twitter.com'
  ];

  const result = {
    suspicious: false,
    similarTo: null,
    score: 0 // 0-100, higher means more suspicious
  };

  // Simple Levenshtein distance to check similarity
  const findSimilarity = (s1, s2) => {
    const longerStr = s1.length > s2.length ? s1 : s2;
    const shorterStr = s1.length > s2.length ? s2 : s1;
    // Exit early if length difference is too big
    if (longerStr.length - shorterStr.length > 3) return 0;

    let costs = [];
    for (let i = 0; i <= shorterStr.length; i++) {
      costs[i] = i;
    }

    for (let i = 1; i <= longerStr.length; i++) {
      costs[0] = i;
      let nw = i - 1;
      for (let j = 1; j <= shorterStr.length; j++) {
        let cj = Math.min(
          1 + Math.min(costs[j], costs[j-1]),
          longerStr[i-1] === shorterStr[j-1] ? nw : nw + 1
        );
        nw = costs[j];
        costs[j] = cj;
      }
    }

    return 1 - (costs[shorterStr.length] / Math.max(longerStr.length, shorterStr.length));
  };

  // Check against each popular domain
  for (const popularDomain of popularDomains) {
    const similarity = findSimilarity(
      domain.replace(/\./g, '').toLowerCase(),
      popularDomain.replace(/\./g, '').toLowerCase()
    );

    // If similarity is high but not exact match
    if (similarity > 0.8 && similarity < 1.0) {
      result.suspicious = true;
      result.similarTo = popularDomain;
      result.score = Math.round(similarity * 100);
      break;
    }
  }

  // Additional checks for common typosquatting techniques
  for (const popularDomain of popularDomains) {
    const root = popularDomain.split('.')[0];
    // Check for added characters
    if (domain.includes(root) && domain !== popularDomain) {
      result.suspicious = true;
      result.similarTo = popularDomain;
      result.score = 85;
      break;
    }

    // Check for character substitution (like '0' for 'o')
    const normalizedDomain = domain.replace(/0/g, 'o').replace(/1/g, 'l');
    if (normalizedDomain.includes(root) && domain !== popularDomain) {
      result.suspicious = true;
      result.similarTo = popularDomain;
      result.score = 90;
      break;
    }
  }

  return result;
}

// Function 4: Scan for malicious patterns
function scanForMaliciousPatterns(url) {
  const results = {
    suspicious: false,
    patterns: [],
    score: 0 // Higher means more suspicious
  };

  // Common patterns in phishing or malicious URLs
  const patterns = [
    { pattern: /\/password|passwd|login|signin|authenticate|auth|account|acct|secure|banking/i,
      description: 'Contains sensitive action terms'},
    { pattern: /\.(exe|dll|bat|sh|msi)$/i,
      description: 'Links to executable file' },
    { pattern: /\?[^=]+=https?%3A/i,
      description: 'Contains URL redirection pattern' },
    { pattern: /@/i,
      description: 'Contains @ symbol (potential URL trickery)' },
    { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
      description: 'Contains raw IP address instead of domain' },
    { pattern: /[^\w\-\.\/\?\=\&\%]/i,
      description: 'Contains unusual URL characters' },
    { pattern: /free|offer|prize|won|winner|discount|deal|promo|gift/i,
      description: 'Contains marketing bait terms' },
    { pattern: /password|passwd|credentials|credit|wallet|ssn|social|bank|login/i,
      description: 'Contains terms related to sensitive information' },
    { pattern: /verify|confirm|update|secure|protect|restore|unlock/i,
      description: 'Contains action terms often used in phishing' }
  ];

  // Check each pattern
  patterns.forEach(({ pattern, description }) => {
    if (pattern.test(url)) {
      results.suspicious = true;
      results.patterns.push(description);
      results.score += 15; // Increment suspicion score
    }
  });

  // Cap the score at 100
  results.score = Math.min(results.score, 100);
  return results;
}

// Main URL safety checking function (update this to use the new functions)
export async function checkUrlSafety(url) {
  try {
    const results = {
      isUrl: true,
      safe: false, // Default to unsafe until proven otherwise
      https: false,
      validCert: false,
      maliciousCheck: false,
      domainInfo: null,
      details: '',
      wasShortened: false,
      originalUrl: null,
      expandedUrl: null,
      domainReputation: null,
      typosquatting: null,
      maliciousPatterns: null
    };
    
    // Step 1: Check if the URL is shortened and expand it if needed
    const expandedUrl = await expandShortUrl(url);
    if (expandedUrl !== url) {
      results.originalUrl = url;
      url = expandedUrl;
      results.expandedUrl = expandedUrl;
      results.wasShortened = true;
    }

    // Check if the URL uses HTTPS
    results.https = url.startsWith('https://');
    
    // Basic URL validation using URL constructor (will throw if invalid)
    try {
      new URL(url);
    } catch (error) {
      return {
        isUrl: true,
        safe: false, 
        details: 'Invalid URL format detected.'
      };
    }
    
    // Extract domain for further checks
    const domain = new URL(url).hostname;
    
    // Step 2: Check domain reputation
    results.domainReputation = await checkDomainReputation(domain);
    
    // Step 3: Check for typosquatting
    results.typosquatting = checkForTyposquatting(domain);
    
    // Step 4: Scan for malicious patterns
    results.maliciousPatterns = scanForMaliciousPatterns(url);

    // Check for suspicious/phishing domains (simplified example)
    const suspiciousDomains = [
      'phishing', 'scam', 'malware', 'virus', 'hack',
      'free-prize', 'claim-reward', 'authenticate', 'verify-account',
      'account-alert', 'secure-login', 'signin', 'login-verify'
    ];
    
    const containsSuspiciousTerm = suspiciousDomains.some(term => 
      domain.toLowerCase().includes(term.toLowerCase())
    );
    
    if (containsSuspiciousTerm) {
      results.maliciousCheck = true;
      results.details = 'Domain contains suspicious terms.';
    }

    // Check for SSL/TLS (this is a simplified check)
    // In a real app, you would use a server-side proxy for this
    if (results.https) {
      try {
        // Simple HEAD request to check if the cert is valid
        // Note: This isn't a complete cert validation, just a basic check
        await axios.head(url, { timeout: 5000 });
        results.validCert = true;
      } catch (error) {
        // If there's an SSL error, the cert may be invalid
        // But this could also be other network errors
        results.validCert = false;
        results.details = 'Could not validate SSL/TLS certificate.';
      }
    }

    // Google Safe Browsing API check (simplified version)
    // In real app, you would use a server-side proxy for this API call
    // The following is just to demonstrate the concept
    try {
      // For this demo, we'll use a simplified "mock" check
      // In reality, you should implement the actual API call above
      const isMalicious = domain.includes('evil') || 
        domain.includes('phish') || 
        domain.includes('malware');
      
      if (isMalicious) {
        results.maliciousCheck = true;
        results.details = 'URL flagged as potentially malicious.';
      }

      // Add domain info (in a real app you might use WHOIS data)
      results.domainInfo = `Domain: ${domain}`;
    } catch (error) {
      console.error('Error during malicious check:', error);
      // If we can't check, warn the user
      results.details = 'Could not complete security check. Proceed with caution.';
    }

    // Determine final safety assessment based on all checks
    // A URL is considered safe if:
    // 1. It uses HTTPS
    // 2. It has a valid SSL/TLS certificate (or we couldn't check)
    // 3. It wasn't flagged as malicious
    // 4. Its domain reputation is good
    // 5. It's not a typosquatting attempt
    // 6. It doesn't contain malicious patterns
    results.safe = results.https && 
      (results.validCert || results.validCert === null) && 
      !results.maliciousCheck &&
      (results.domainReputation && results.domainReputation.score >= 50) &&
      (!results.typosquatting || !results.typosquatting.suspicious) &&
      (!results.maliciousPatterns || results.maliciousPatterns.score < 30);

    return results;
  } catch (error) {
    console.error('Error checking URL safety:', error);
    return {
      isUrl: true,
      safe: false,
      details: 'Error analyzing URL safety. Proceed with caution.'
    };
  }
}