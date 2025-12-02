// utils/analysisStrategies.js - Strategy Pattern implementations for different checks
import axios from 'axios';
import { API_CONFIG } from '../config';

/**
 * Base Strategy Interface
 * All analysis strategies inherit from this
 */
class AnalysisStrategy {
  constructor(name) {
    this.name = name;
  }

  async analyze(url) {
    throw new Error('analyze() must be implemented by subclass');
  }
}

/**
 * Google Safe Browsing Strategy
 * Uses Google Safe Browsing API v4 to check for malicious URLs
 * API Documentation: https://developers.google.com/safe-browsing/v4
 */
export class SafeBrowsingStrategy extends AnalysisStrategy {
  constructor() {
    super('safeBrowsing');
  }

  async analyze(url) {
    try {
      const apiKey = API_CONFIG.GOOGLE_SAFE_BROWSING_KEY;
      
      if (!apiKey || apiKey === 'YOUR_GOOGLE_SAFE_BROWSING_API_KEY') {
        return { 
          isSafe: null, 
          message: 'Google Safe Browsing API key not configured',
          requiresSetup: true,
          risk: 'unknown'
        };
      }

      const requestBody = {
        client: {
          clientId: 'quishthis',
          clientVersion: '2.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      };

      const response = await axios.post(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        requestBody,
        { timeout: 10000 }
      );

      const isSafe = !response.data.matches || response.data.matches.length === 0;

      return {
        isSafe,
        threats: response.data.matches || [],
        risk: isSafe ? 'low' : 'high',
        message: isSafe ? 'No threats detected by Google Safe Browsing' : 'Threats detected by Google Safe Browsing'
      };

    } catch (error) {
      console.error('Safe Browsing check failed:', error.message);
      return { 
        error: error.message, 
        isSafe: null,
        risk: 'unknown'
      };
    }
  }
}

/**
 * URL Shortener Detection & Expansion Strategy
 * Detects and expands shortened URLs (bit.ly, tinyurl, etc.)
 */
export class URLExpansionStrategy extends AnalysisStrategy {
  constructor() {
    super('urlExpansion');
    this.shorteners = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 
      'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'short.io',
      'rebrand.ly', 'cutt.ly', 'tiny.cc', 'shorturl.at',
      'rb.gy', 'shorturl.com', 't2m.io'
    ];
  }

  async analyze(url) {
    try {
      const urlObj = new URL(url);
      const isShortened = this.shorteners.some(shortener => 
        urlObj.hostname.toLowerCase().includes(shortener.toLowerCase())
      );

      if (!isShortened) {
        return {
          isShortened: false,
          original: url,
          expanded: url,
          risk: 'low',
          message: 'Not a shortened URL'
        };
      }

      // Try to expand via axios following redirects
      const response = await axios.get(url, {
        maxRedirects: 5,
        validateStatus: () => true,
        timeout: 5000,
        maxContentLength: 1000
      });

      const expandedUrl = response.request?.responseURL || url;

      return {
        isShortened: true,
        original: url,
        expanded: expandedUrl,
        redirectCount: response.request?.res?._redirectCount || 0,
        suspicious: expandedUrl !== url && response.request?.res?._redirectCount > 3,
        risk: (expandedUrl !== url && response.request?.res?._redirectCount > 3) ? 'medium' : 'low',
        message: expandedUrl !== url ? `Expanded from ${urlObj.hostname}` : 'Could not expand URL'
      };

    } catch (error) {
      console.error('URL expansion failed:', error.message);
      return { 
        error: error.message,
        isShortened: null,
        risk: 'unknown'
      };
    }
  }
}

/**
 * Domain Reputation Strategy  
 * Checks domain age, registrar, and WHOIS information
 */
export class DomainReputationStrategy extends AnalysisStrategy {
  constructor() {
    super('domainReputation');
  }

  async analyze(url) {
    try {
      const domain = new URL(url).hostname;

      // Basic heuristic checks first
      const heuristicScore = this.performHeuristicChecks(domain);

      // If WHOIS API is configured, get detailed info
      if (API_CONFIG.WHOIS_API_KEY && API_CONFIG.WHOIS_API_KEY !== 'YOUR_WHOIS_API_KEY') {
        try {
          const whoisData = await this.fetchWhoisData(domain);
          return {
            ...whoisData,
            ...heuristicScore
          };
        } catch (whoisError) {
          console.warn('WHOIS lookup failed, using heuristics only:', whoisError.message);
        }
      }

      // Return heuristic-only results
      return heuristicScore;

    } catch (error) {
      console.error('Domain reputation check failed:', error.message);
      return { 
        error: error.message,
        risk: 'unknown'
      };
    }
  }

  performHeuristicChecks(domain) {
    const result = {
      domain,
      score: 50, // Neutral starting point
      details: [],
      risk: 'medium'
    };

    // Trusted domains list
    const trustedDomains = [
      'google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'github.com',
      'youtube.com', 'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com'
    ];

    const rootDomain = this.extractRootDomain(domain);
    if (trustedDomains.includes(rootDomain)) {
      result.score = 90;
      result.risk = 'low';
      result.details.push('Trusted domain');
      return result;
    }

    // Suspicious TLD check
    const suspiciousTlds = ['.xyz', '.top', '.club', '.online', '.info', '.work', '.click'];
    if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
      result.score -= 20;
      result.details.push('Uses suspicious TLD');
    }

    // Domain length check
    if (domain.length > 40) {
      result.score -= 10;
      result.details.push('Unusually long domain');
    }

    // Subdomain count
    const subdomains = domain.split('.').length - 2;
    if (subdomains > 2) {
      result.score -= 15;
      result.details.push('Multiple subdomains');
    }

    // Determine risk level
    if (result.score >= 60) result.risk = 'low';
    else if (result.score >= 40) result.risk = 'medium';
    else result.risk = 'high';

    result.message = `Domain reputation score: ${result.score}/100`;
    return result;
  }

  async fetchWhoisData(domain) {
    const apiKey = API_CONFIG.WHOIS_API_KEY;
    const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`;
    
    const response = await axios.get(url, { timeout: 10000 });
    const record = response.data?.WhoisRecord;

    if (!record) throw new Error('No WHOIS data returned');

    const ageInDays = this.calculateDomainAge(record.createdDate);

    return {
      domain,
      registrar: record.registrarName || 'Unknown',
      createdDate: record.createdDate || 'Unknown',
      ageInDays,
      ageDescription: this.describeAge(ageInDays),
      risk: ageInDays < 30 ? 'high' : ageInDays < 365 ? 'medium' : 'low',
      message: `Domain created ${this.describeAge(ageInDays)} ago`
    };
  }

  extractRootDomain(domain) {
    const parts = domain.split('.');
    if (parts.length > 2) {
      return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return domain;
  }

  calculateDomainAge(createdDate) {
    if (!createdDate) return null;
    try {
      const created = new Date(createdDate);
      const now = new Date();
      const diffMs = now - created;
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }

  describeAge(days) {
    if (days === null) return 'unknown';
    if (days < 30) return 'very new (< 1 month)';
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  }
}

/**
 * SSL/TLS Certificate Strategy
 * Validates SSL certificate and HTTPS configuration
 */
export class SSLValidationStrategy extends AnalysisStrategy {
  constructor() {
    super('ssl');
  }

  async analyze(url) {
    try {
      const urlObj = new URL(url);
      
      // Basic HTTPS check
      if (urlObj.protocol !== 'https:') {
        return {
          hasSSL: false,
          risk: 'high',
          message: 'URL does not use HTTPS encryption',
          recommendation: 'Never enter sensitive information'
        };
      }

      // Try to validate certificate
      try {
        const response = await axios.head(url, { 
          timeout: 5000,
          validateStatus: () => true
        });

        return {
          hasSSL: true,
          validCert: response.status < 400,
          risk: response.status < 400 ? 'low' : 'medium',
          message: response.status < 400 
            ? 'Valid HTTPS connection' 
            : 'HTTPS present but may have certificate issues'
        };
      } catch (certError) {
        return {
          hasSSL: true,
          validCert: false,
          risk: 'medium',
          message: 'Could not validate SSL certificate',
          error: certError.message
        };
      }

    } catch (error) {
      console.error('SSL validation failed:', error.message);
      return { 
        error: error.message,
        hasSSL: null,
        risk: 'unknown'
      };
    }
  }
}

/**
 * Typosquatting Detection Strategy
 * Detects domains that may be impersonating popular brands
 * Can use VirusTotal API for enhanced detection
 */
export class TyposquattingStrategy extends AnalysisStrategy {
  constructor() {
    super('typosquatting');
    
    this.legitimateDomains = [
      'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
      'apple.com', 'paypal.com', 'netflix.com', 'instagram.com',
      'twitter.com', 'linkedin.com', 'ebay.com', 'walmart.com',
      'bankofamerica.com', 'chase.com', 'wellsfargo.com', 'citibank.com'
    ];
  }

  async analyze(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');

      // Basic similarity check
      const suspectedTarget = this.findSuspectedTarget(domain);
      
      if (!suspectedTarget) {
        return {
          isTyposquat: false,
          risk: 'low',
          message: 'No typosquatting detected'
        };
      }

      // If VirusTotal API is available, use it for enhanced detection
      if (API_CONFIG.VIRUS_TOTAL_API_KEY && API_CONFIG.VIRUS_TOTAL_API_KEY !== 'YOUR_VIRUSTOTAL_API_KEY') {
        try {
          const vtResult = await this.checkVirusTotal(domain);
          return {
            isTyposquat: vtResult.isSuspicious,
            suspectedTarget,
            domain,
            risk: vtResult.isSuspicious ? 'high' : 'medium',
            detectionRatio: vtResult.detectionRatio,
            message: vtResult.isSuspicious 
              ? `Possible typosquat of ${suspectedTarget} (confirmed by VirusTotal)` 
              : `Similar to ${suspectedTarget}, appears legitimate`
          };
        } catch (vtError) {
          console.warn('VirusTotal check failed:', vtError.message);
        }
      }

      // Fallback to heuristic check
      return {
        isTyposquat: true,
        suspectedTarget,
        risk: 'medium',
        message: `Domain similar to ${suspectedTarget} - verify authenticity`
      };

    } catch (error) {
      console.error('Typosquatting check failed:', error.message);
      return { 
        error: error.message,
        isTyposquat: null,
        risk: 'unknown'
      };
    }
  }

  async checkVirusTotal(domain) {
    const apiKey = API_CONFIG.VIRUS_TOTAL_API_KEY;
    const url = `https://www.virustotal.com/api/v3/domains/${domain}`;
    
    const response = await axios.get(url, {
      headers: { 'x-apikey': apiKey },
      timeout: 10000
    });

    const data = response.data?.data?.attributes;
    if (!data) throw new Error('No VirusTotal data');

    const malicious = data.last_analysis_stats?.malicious || 0;
    const suspicious = data.last_analysis_stats?.suspicious || 0;
    const total = Object.values(data.last_analysis_stats || {}).reduce((a, b) => a + b, 0);

    return {
      isSuspicious: malicious > 0 || suspicious > 0,
      detectionRatio: `${malicious + suspicious}/${total}`,
      reputation: data.reputation
    };
  }

  findSuspectedTarget(domain) {
    for (const legitimate of this.legitimateDomains) {
      if (this.isSimilar(domain, legitimate)) {
        return legitimate;
      }
    }
    return null;
  }

  isSimilar(domain1, domain2) {
    const distance = this.levenshteinDistance(domain1, domain2);
    const maxLength = Math.max(domain1.length, domain2.length);
    const similarity = 1 - distance / maxLength;
    
    return similarity > 0.7 && similarity < 1.0;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Phishing Pattern Strategy
 * Detects common phishing patterns in URLs
 */
export class PhishingPatternStrategy extends AnalysisStrategy {
  constructor() {
    super('phishingPattern');
    
    this.suspiciousKeywords = [
      'verify', 'account', 'suspend', 'confirm', 'login', 'signin',
      'banking', 'secure', 'update', 'password', 'credential',
      'validate', 'restore', 'limited', 'urgent', 'action-required'
    ];

    this.suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
  }

  async analyze(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname.toLowerCase();
      const fullURL = url.toLowerCase();
      
      let suspicionScore = 0;
      const flags = [];

      // Check for suspicious keywords
      this.suspiciousKeywords.forEach(keyword => {
        if (fullURL.includes(keyword)) {
          suspicionScore += 15;
          flags.push(`Contains keyword: "${keyword}"`);
        }
      });

      // Check for suspicious TLD
      if (this.suspiciousTLDs.some(tld => domain.endsWith(tld))) {
        suspicionScore += 20;
        flags.push('Uses suspicious TLD');
      }

      // Check for IP address in URL
      if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(domain)) {
        suspicionScore += 25;
        flags.push('Uses IP address instead of domain');
      }

      // Check for excessive subdomains
      const subdomains = domain.split('.').length - 2;
      if (subdomains > 2) {
        suspicionScore += 10;
        flags.push('Excessive subdomains');
      }

      // Check for @ symbol (credential obfuscation)
      if (urlObj.href.includes('@')) {
        suspicionScore += 30;
        flags.push('Contains @ symbol (obfuscation tactic)');
      }

      // Check for excessive hyphens
      const hyphenCount = (domain.match(/-/g) || []).length;
      if (hyphenCount > 3) {
        suspicionScore += 10;
        flags.push('Excessive hyphens in domain');
      }

      const isPhishing = suspicionScore >= 40;
      const risk = suspicionScore >= 40 ? 'high' : suspicionScore >= 20 ? 'medium' : 'low';

      return {
        isPhishing,
        suspicionScore,
        flags,
        risk,
        message: flags.length > 0 
          ? `${flags.length} phishing indicators found` 
          : 'No obvious phishing patterns detected'
      };

    } catch (error) {
      console.error('Phishing pattern check failed:', error.message);
      return { 
        error: error.message,
        isPhishing: null,
        risk: 'unknown'
      };
    }
  }
}