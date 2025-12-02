// utils/urlAnalyzer.js - Core URL analysis service using Facade Pattern
import { CACHE_CONFIG } from '../config';

/**
 * URLAnalyzer - Facade pattern for URL analysis
 * Provides a simplified interface to complex subsystems
 * Uses Flyweight pattern for caching to reduce memory usage
 */
class URLAnalyzer {
  constructor() {
    this.strategies = [];
    this.cache = new Map();
  }

  /**
   * Register an analysis strategy
   */
  registerStrategy(strategy) {
    this.strategies.push(strategy);
  }

  /**
   * Analyze URL using all registered strategies
   */
  async analyze(url) {
    // Check cache first (Flyweight pattern - reuse existing results)
    const cacheKey = this.generateCacheKey(url);
    if (CACHE_CONFIG.ENABLED && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_CONFIG.TTL) {
        console.log('Returning cached result for:', url);
        return cached.data;
      } else {
        // Expired, remove it
        this.cache.delete(cacheKey);
      }
    }

    const results = {
      url,
      timestamp: new Date().toISOString(),
      checks: {},
      overallSafety: 'unknown',
      riskScore: 0,
      recommendations: []
    };

    // Execute all strategies in parallel
    const strategyPromises = this.strategies.map(strategy =>
      strategy.analyze(url).catch(error => ({
        error: error.message,
        strategy: strategy.name
      }))
    );

    const strategyResults = await Promise.allSettled(strategyPromises);

    // Aggregate results
    strategyResults.forEach((result, index) => {
      const strategy = this.strategies[index];
      if (result.status === 'fulfilled') {
        results.checks[strategy.name] = result.value;
      } else {
        results.checks[strategy.name] = { error: result.reason?.message || 'Unknown error' };
      }
    });

    // Calculate overall risk
    results.riskScore = this.calculateRiskScore(results.checks);
    results.overallSafety = this.determineOverallSafety(results.riskScore);
    results.recommendations = this.generateRecommendations(results.checks, results.riskScore);

    // Cache results (Flyweight pattern)
    if (CACHE_CONFIG.ENABLED) {
      // Limit cache size
      if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
        // Remove oldest entry
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });
    }

    return results;
  }

  generateCacheKey(url) {
    // Simple base64 encoding for cache key
    try {
      return btoa(url);
    } catch {
      // Fallback for non-ASCII characters
      return encodeURIComponent(url);
    }
  }

  calculateRiskScore(checks) {
    let score = 0;
    let totalChecks = 0;

    Object.values(checks).forEach(check => {
      if (check && !check.error) {
        totalChecks++;
        if (check.isSafe === false || check.risk === 'high') {
          score += 30;
        } else if (check.risk === 'medium' || check.suspicious) {
          score += 15;
        } else if (check.risk === 'low' || check.warnings) {
          score += 5;
        }
      }
    });

    return Math.min(100, score);
  }

  determineOverallSafety(riskScore) {
    if (riskScore >= 50) return 'dangerous';
    if (riskScore >= 25) return 'suspicious';
    if (riskScore >= 10) return 'caution';
    return 'safe';
  }

  generateRecommendations(checks, riskScore) {
    const recommendations = [];

    if (riskScore >= 50) {
      recommendations.push('🛑 Do not visit this URL');
      recommendations.push('Report this URL to authorities');
    } else if (riskScore >= 25) {
      recommendations.push('⚠️ Exercise extreme caution');
      recommendations.push('Verify the sender/source');
    } else if (riskScore >= 10) {
      recommendations.push('⚡ Be cautious when proceeding');
    }

    // Specific recommendations based on checks
    if (checks.ssl && checks.ssl.hasWarnings) {
      recommendations.push('SSL certificate has warnings');
    }
    
    if (checks.domainReputation && checks.domainReputation.ageInDays < 30) {
      recommendations.push('Domain is very new (< 30 days)');
    }

    if (checks.phishingPattern && checks.phishingPattern.isPhishing) {
      recommendations.push('Confirmed phishing patterns detected');
    }

    if (checks.typosquatting && checks.typosquatting.isTyposquat) {
      recommendations.push(`Possible impersonation of ${checks.typosquatting.suspectedTarget}`);
    }

    return recommendations;
  }

  clearCache() {
    this.cache.clear();
    console.log('Analysis cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_SIZE,
      enabled: CACHE_CONFIG.ENABLED
    };
  }
}

// Singleton instance
export const urlAnalyzer = new URLAnalyzer();

export default URLAnalyzer;