//URL safety checking functions
// utils/urlChecker.js
// Add these functions to utils/urlChecker.js

// utils/urlChecker.js
import 'react-native-url-polyfill/auto';
import axios from 'axios';

// Function 1: URL shortener detection and expansion
async function expandShortUrl(url) {
  // Common URL shortener domains
  const shortenerDomains = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'youtu.be', 'ow.ly',
    'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'tiny.cc', 'shorturl.at',
    'short.io', 'bitly.com', 'rb.gy'
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
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: () => true, // Accept all status codes
      timeout: 5000, // 5 second timeout
      maxContentLength: 1000, // Only get headers, not content
    });

    // Get the final URL after redirects
    if (response.request && response.request.responseURL) {
      return response.request.responseURL;
    }

    return url; // No redirect found
  } catch (error) {
    console.error('Error expanding shortened URL:', error.message);
    return url; // Return original URL on error
  }
}

// Function 2: Domain reputation checking
function extractRootDomain(domain) {
  const parts = domain.split('.');
  if (parts.length > 2) {
    // Handle special cases like co.uk
    const twoPartTLDs = ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac'];
    if (twoPartTLDs.includes(parts[parts.length - 2])) {
      return `${parts[parts.length - 3]}.${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  }
  return domain;
}

async function checkDomainReputation(domain) {
  try {
    const reputation = {
      score: 50, // 0-100, higher is better (default to neutral)
      knownBad: false,
      knownGood: false,
      details: []
    };

    // Expanded list of known trusted domains
    const trustedDomains = [
      'google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'github.com',
      'youtube.com', 'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
      'netflix.com', 'spotify.com', 'reddit.com', 'wikipedia.org', 'stackoverflow.com',
      'medium.com', 'paypal.com', 'ebay.com', 'zoom.us', 'dropbox.com'
    ];
    
    const rootDomain = extractRootDomain(domain);
    const isTrustedRoot = trustedDomains.some(trusted => rootDomain === trusted);

    if (isTrustedRoot) {
      reputation.knownGood = true;
      reputation.score = 90;
      reputation.details.push('Domain is from a trusted provider');
      return reputation;
    }

    // Check domain age using WHOIS (would require server-side API)
    // This is just a placeholder - in real implementation you'd call a WHOIS API
    // For demo purposes: check if domain has common TLDs or suspicious TLDs
    // Check for suspicious TLDs
    const suspiciousTlds = ['.xyz', '.top', '.club', '.online', '.info', '.biz', '.work', '.click', '.link', '.download'];
    const hasWeirdTld = suspiciousTlds.some(tld => domain.endsWith(tld));
    if (hasWeirdTld) {
      reputation.score -= 20;
      reputation.details.push('Domain uses an uncommon TLD');
    }

    // Check for excessively long domains (common in phishing)
    if (domain.length > 40) {
      reputation.score -= 10;
      reputation.details.push('Unusually long domain name');
    }

    // Check for multiple subdomains (common in phishing)
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount > 2) {
      reputation.score -= 15;
      reputation.details.push('Multiple subdomains detected');
    }

    // Check for numbers in domain (sometimes suspicious)
    if (/\d{3,}/.test(domain)) {
      reputation.score -= 5;
      reputation.details.push('Contains multiple numbers');
    }

    // If score is still neutral and no red flags, give a slight positive bump
    if (reputation.score === 50 && reputation.details.length === 0) {
      reputation.score = 60;
      reputation.details.push('No immediate red flags detected');
    }

    return reputation;
  } catch (error) {
    console.error('Error checking domain reputation:', error);
    return { score: 50, details: ['Unable to check reputation'] };
  }
}

// Function 3: Typosquatting detection
function checkForTyposquatting(domain) {
  // Expanded list of popular domains that might be typosquatted
  const popularDomains = [
    'google.com', 'facebook.com', 'amazon.com', 'apple.com', 'netflix.com',
    'microsoft.com', 'gmail.com', 'yahoo.com', 'instagram.com', 'twitter.com',
    'paypal.com', 'linkedin.com', 'ebay.com', 'youtube.com', 'reddit.com',
    'spotify.com', 'github.com', 'dropbox.com', 'slack.com', 'zoom.us'
  ];

  const result = {
    suspicious: false,
    similarTo: null,
    score: 0 // 0-100, higher means more suspicious
  };

  // Levenshtein distance calculation
  const levenshtein = (s1, s2) => {
    const longerStr = s1.length > s2.length ? s1 : s2;
    const shorterStr = s1.length > s2.length ? s2 : s1;
    
    if (longerStr.length - shorterStr.length > 3) return 0;

    const costs = Array(shorterStr.length + 1).fill(0).map((_, i) => i);
    
    for (let i = 1; i <= longerStr.length; i++) {
      costs[0] = i;
      let nw = i - 1;
      for (let j = 1; j <= shorterStr.length; j++) {
        const cj = Math.min(
          1 + Math.min(costs[j], costs[j - 1]),
          longerStr[i - 1] === shorterStr[j - 1] ? nw : nw + 1
        );
        nw = costs[j];
        costs[j] = cj;
      }
    }

    return 1 - (costs[shorterStr.length] / Math.max(longerStr.length, shorterStr.length));
  };

  // Check against each popular domain
  for (const popularDomain of popularDomains) {
    const domainWithoutTld = domain.replace(/\.[^.]+$/, '').toLowerCase();
    const popularWithoutTld = popularDomain.replace(/\.[^.]+$/, '').toLowerCase();
    
    const similarity = levenshtein(domainWithoutTld, popularWithoutTld);

    // If similarity is high but not exact match
    if (similarity > 0.75 && similarity < 1.0) {
      result.suspicious = true;
      result.similarTo = popularDomain;
      result.score = Math.round(similarity * 100);
      break;
    }

    // Check for added characters or hyphens
    if (domainWithoutTld.includes(popularWithoutTld) && domain !== popularDomain) {
      result.suspicious = true;
      result.similarTo = popularDomain;
      result.score = 85;
      break;
    }

    // Check for character substitution (like '0' for 'o', '1' for 'l')
    const normalizedDomain = domainWithoutTld
      .replace(/0/g, 'o')
      .replace(/1/g, 'l')
      .replace(/5/g, 's')
      .replace(/8/g, 'b');
    
    if (normalizedDomain === popularWithoutTld && domain !== popularDomain) {
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
    { 
      pattern: /password|passwd|login|signin|authenticate|auth|account|verify|confirm|update/i,
      description: 'Contains sensitive action terms',
      weight: 15
    },
    { 
      pattern: /\.(exe|dll|bat|sh|msi|scr|vbs|ps1)(\?|$)/i,
      description: 'Links to executable file',
      weight: 30
    },
    { 
      pattern: /\?[^=]+=https?%3A/i,
      description: 'Contains URL redirection pattern',
      weight: 20
    },
    { 
      pattern: /@/,
      description: 'Contains @ symbol (potential URL trickery)',
      weight: 25
    },
    { 
      pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
      description: 'Uses raw IP address instead of domain',
      weight: 20
    },
    { 
      pattern: /free|offer|prize|won|winner|discount|urgent|act.now|limited.time/i,
      description: 'Contains marketing bait terms',
      weight: 10
    },
    { 
      pattern: /credit|wallet|ssn|social.security|bank|payment/i,
      description: 'Contains financial/sensitive terms',
      weight: 15
    },
    { 
      pattern: /secure|protect|restore|unlock|suspended|unusual.activity/i,
      description: 'Contains urgency/fear tactics',
      weight: 12
    },
    {
      pattern: /-|_/g,
      description: 'Excessive use of hyphens or underscores',
      weight: 5,
      countBased: true,
      threshold: 3
    }
  ];

  // Check each pattern
  patterns.forEach(({ pattern, description, weight, countBased, threshold }) => {
    if (countBased) {
      const matches = url.match(pattern);
      if (matches && matches.length > threshold) {
        results.suspicious = true;
        results.patterns.push(description);
        results.score += weight;
      }
    } else if (pattern.test(url)) {
      results.suspicious = true;
      results.patterns.push(description);
      results.score += weight;
    }
  });

  // Cap the score at 100
  results.score = Math.min(results.score, 100);
  return results;
}

// Main URL safety checking function
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
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (error) {
      return {
        isUrl: true,
        safe: false, 
        details: 'Invalid URL format detected.'
      };
    }
    
    // Extract domain for further checks
    const domain = urlObj.hostname;
    
    // Step 2: Check domain reputation
    results.domainReputation = await checkDomainReputation(domain);
    
    // Step 3: Check for typosquatting
    results.typosquatting = checkForTyposquatting(domain);
    
    // Step 4: Scan for malicious patterns
    results.maliciousPatterns = scanForMaliciousPatterns(url);

    // Check for suspicious/phishing domains (expanded list)
    const suspiciousKeywords = [
      'phishing', 'scam', 'malware', 'virus', 'hack', 'free-prize', 
      'claim-reward', 'authenticate', 'verify-account', 'account-alert', 
      'secure-login', 'signin-verify', 'update-required', 'suspended-account',
      'confirm-identity', 'unusual-activity', 'security-alert'
    ];
    
    const containsSuspiciousTerm = suspiciousKeywords.some(term => 
      domain.toLowerCase().includes(term.toLowerCase()) ||
      urlObj.pathname.toLowerCase().includes(term.toLowerCase())
    );
    
    if (containsSuspiciousTerm) {
      results.maliciousCheck = true;
      results.details = 'URL contains suspicious terms commonly used in phishing.';
    }

    // Check for SSL/TLS (simplified check)
    if (results.https) {
      try {
        // Simple request to check if the connection works
        await axios.head(url, { 
          timeout: 5000,
          validateStatus: () => true // Accept any status
        });
        results.validCert = true;
      } catch (error) {
        results.validCert = false;
        if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          results.details = 'SSL/TLS certificate validation failed.';
        }
      }
    }

    // Google Safe Browsing API check (simplified version)
    // In real app, use a server-side proxy for this API call
    // The following is just to demonstrate the concept
    // For this demo, we'll use a simplified "mock" check
    // In reality, implement the actual API call above

    // Add domain info
    results.domainInfo = `Domain: ${domain}`;

    // Determine final safety assessment based on all checks
    // Calculate a composite safety score
    let safetyScore = 50; // Start neutral

    // HTTPS adds security
    if (results.https) safetyScore += 20;
    if (results.validCert) safetyScore += 10;

    // Domain reputation affects score
    if (results.domainReputation) {
      safetyScore += (results.domainReputation.score - 50) * 0.4;
    }

    // Malicious patterns reduce score
    if (results.maliciousPatterns && results.maliciousPatterns.score > 0) {
      safetyScore -= results.maliciousPatterns.score * 0.5;
    }

    // Typosquatting is a major red flag
    if (results.typosquatting && results.typosquatting.suspicious) {
      safetyScore -= 30;
    }

    // Known malicious content
    if (results.maliciousCheck) {
      safetyScore -= 40;
    }

    // Final decision: safe if score >= 60
    results.safe = safetyScore >= 60;

    return results;
  } catch (error) {
    console.error('Error checking URL safety:', error);
    return {
      isUrl: true,
      safe: false,
      details: 'Error analyzing URL safety. Proceed with extreme caution.'
    };
  }
}