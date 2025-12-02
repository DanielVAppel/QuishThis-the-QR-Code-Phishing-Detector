// server.js - Backend server for URL expansion, WHOIS, and advanced checks
// Run with: node server.js
// Make sure to install: npm install express cors axios dotenv

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Keys from environment or config.js
const API_KEYS = {
  GOOGLE_SAFE_BROWSING: process.env.GOOGLE_SAFE_BROWSING_API_KEY || 'YOUR_API_KEY',
  WHOIS: process.env.WHOIS_API_KEY || 'YOUR_WHOIS_API_KEY',
  VIRUS_TOTAL: process.env.VIRUS_TOTAL_API_KEY || 'YOUR_VIRUSTOTAL_API_KEY'
};

/**
 * Health Check Endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    endpoints: {
      '/api/expand-url': 'POST - Expand shortened URLs',
      '/api/whois': 'POST - WHOIS domain lookup',
      '/api/ssl-check': 'POST - SSL certificate validation',
      '/api/safe-browsing': 'POST - Google Safe Browsing check',
      '/api/virus-total': 'POST - VirusTotal domain check'
    }
  });
});

/**
 * URL Expansion Service
 * POST /api/expand-url
 * Body: { url: string }
 * Follows redirects to get the final destination URL
 */
app.post('/api/expand-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Follow redirects to get final URL
    const response = await axios.get(url, {
      method: 'HEAD',
      maxRedirects: 5,
      validateStatus: () => true,
      timeout: 10000
    });

    const expandedUrl = response.request?.res?.responseUrl || url;
    const redirected = expandedUrl !== url;

    res.json({
      original: url,
      expanded: expandedUrl,
      redirected,
      statusCode: response.status,
      redirectCount: response.request?._redirectCount || 0
    });

  } catch (error) {
    console.error('URL expansion error:', error.message);
    res.status(500).json({
      error: 'Failed to expand URL',
      details: error.message,
      original: req.body.url
    });
  }
});

/**
 * WHOIS Domain Lookup
 * POST /api/whois
 * Body: { domain: string }
 * Retrieves domain registration information
 */
app.post('/api/whois', async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Clean domain (remove protocol, path, etc.)
    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '');

    // Check if WHOIS API is configured
    if (API_KEYS.WHOIS === 'YOUR_WHOIS_API_KEY') {
      return res.json({
        error: 'WHOIS API not configured',
        message: 'Please set WHOIS_API_KEY in .env file',
        domain: cleanDomain,
        requiresSetup: true
      });
    }

    // Using WhoisXMLAPI
    const whoisUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${API_KEYS.WHOIS}&domainName=${cleanDomain}&outputFormat=JSON`;
    
    const response = await axios.get(whoisUrl, { timeout: 15000 });
    const record = response.data?.WhoisRecord;

    if (record) {
      res.json({
        domain: cleanDomain,
        registrar: record.registrarName || 'Unknown',
        createdDate: record.createdDate || 'Unknown',
        expiresDate: record.expiresDate || 'Unknown',
        updatedDate: record.updatedDate || 'Unknown',
        nameServers: record.nameServers?.hostNames || [],
        status: record.status || [],
        ageInDays: record.estimatedDomainAge || null
      });
    } else {
      throw new Error('WHOIS data not available');
    }

  } catch (error) {
    console.error('WHOIS lookup error:', error.message);
    res.status(500).json({
      error: 'WHOIS lookup failed',
      details: error.message,
      domain: req.body.domain
    });
  }
});

/**
 * SSL Certificate Validation
 * POST /api/ssl-check
 * Body: { url: string }
 * Checks SSL/TLS certificate details
 */
app.post('/api/ssl-check', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const urlObj = new URL(url);
    
    // Check if HTTPS
    if (urlObj.protocol !== 'https:') {
      return res.json({
        hasSSL: false,
        message: 'URL does not use HTTPS',
        risk: 'high'
      });
    }

    // Perform basic SSL check
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: () => true
      });

      res.json({
        hasSSL: true,
        valid: response.status < 400,
        statusCode: response.status,
        message: response.status < 400 
          ? 'Valid HTTPS connection' 
          : 'HTTPS present but certificate may have issues',
        risk: response.status < 400 ? 'low' : 'medium'
      });
    } catch (certError) {
      res.json({
        hasSSL: true,
        valid: false,
        error: certError.message,
        message: 'SSL certificate validation failed',
        risk: 'high'
      });
    }

  } catch (error) {
    console.error('SSL check error:', error.message);
    res.status(500).json({
      error: 'SSL check failed',
      details: error.message
    });
  }
});

/**
 * Google Safe Browsing Check
 * POST /api/safe-browsing
 * Body: { url: string }
 * Checks URL against Google Safe Browsing database
 */
app.post('/api/safe-browsing', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check if API key is configured
    if (API_KEYS.GOOGLE_SAFE_BROWSING === 'YOUR_API_KEY') {
      return res.json({
        error: 'Google Safe Browsing API not configured',
        message: 'Please set GOOGLE_SAFE_BROWSING_API_KEY in .env file',
        requiresSetup: true
      });
    }

    const requestBody = {
      client: {
        clientId: 'quishthis-server',
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
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEYS.GOOGLE_SAFE_BROWSING}`,
      requestBody,
      { timeout: 10000 }
    );

    const isSafe = !response.data.matches || response.data.matches.length === 0;

    res.json({
      safe: isSafe,
      threats: response.data.matches || [],
      risk: isSafe ? 'low' : 'high',
      message: isSafe 
        ? 'No threats detected' 
        : `${response.data.matches.length} threat(s) detected`
    });

  } catch (error) {
    console.error('Safe Browsing check error:', error.message);
    res.status(500).json({
      error: 'Safe Browsing check failed',
      details: error.message
    });
  }
});

/**
 * VirusTotal Domain Check
 * POST /api/virus-total
 * Body: { domain: string }
 * Checks domain reputation using VirusTotal
 */
app.post('/api/virus-total', async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Check if API key is configured
    if (API_KEYS.VIRUS_TOTAL === 'YOUR_VIRUSTOTAL_API_KEY') {
      return res.json({
        error: 'VirusTotal API not configured',
        message: 'Please set VIRUS_TOTAL_API_KEY in .env file',
        requiresSetup: true
      });
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '');

    const response = await axios.get(
      `https://www.virustotal.com/api/v3/domains/${cleanDomain}`,
      {
        headers: {
          'x-apikey': API_KEYS.VIRUS_TOTAL
        },
        timeout: 10000
      }
    );

    const attributes = response.data?.data?.attributes;
    
    if (attributes) {
      const malicious = attributes.last_analysis_stats?.malicious || 0;
      const suspicious = attributes.last_analysis_stats?.suspicious || 0;
      const total = Object.values(attributes.last_analysis_stats || {}).reduce((a, b) => a + b, 0);

      res.json({
        domain: cleanDomain,
        reputation: attributes.reputation,
        categories: attributes.categories,
        malicious,
        suspicious,
        total,
        detectionRatio: `${malicious + suspicious}/${total}`,
        isSuspicious: malicious > 0 || suspicious > 0,
        risk: (malicious + suspicious) > 0 ? 'high' : 'low'
      });
    } else {
      throw new Error('No VirusTotal data available');
    }

  } catch (error) {
    console.error('VirusTotal check error:', error.message);
    res.status(500).json({
      error: 'VirusTotal check failed',
      details: error.message
    });
  }
});

/**
 * Comprehensive Analysis Endpoint
 * POST /api/analyze
 * Body: { url: string }
 * Runs all available checks
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const domain = new URL(url).hostname;

    // Run all checks in parallel
    const results = await Promise.allSettled([
      axios.post(`http://localhost:${PORT}/api/expand-url`, { url }).then(r => r.data),
      axios.post(`http://localhost:${PORT}/api/whois`, { domain }).then(r => r.data),
      axios.post(`http://localhost:${PORT}/api/ssl-check`, { url }).then(r => r.data),
      axios.post(`http://localhost:${PORT}/api/safe-browsing`, { url }).then(r => r.data),
      axios.post(`http://localhost:${PORT}/api/virus-total`, { domain }).then(r => r.data)
    ]);

    const analysis = {
      url,
      timestamp: new Date().toISOString(),
      checks: {
        urlExpansion: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason?.message },
        whois: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason?.message },
        ssl: results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason?.message },
        safeBrowsing: results[3].status === 'fulfilled' ? results[3].value : { error: results[3].reason?.message },
        virusTotal: results[4].status === 'fulfilled' ? results[4].value : { error: results[4].reason?.message }
      }
    };

    res.json(analysis);

  } catch (error) {
    console.error('Comprehensive analysis error:', error.message);
    res.status(500).json({
      error: 'Analysis failed',
      details: error.message
    });
  }
});

/**
 * Report URL Endpoint
 * POST /api/report
 * Body: { url, category, description }
 * Logs reported URLs
 */
app.post('/api/report', async (req, res) => {
  try {
    const { url, category, description } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const report = {
      url,
      category: category || 'phishing',
      description: description || '',
      timestamp: new Date().toISOString(),
      reportId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Log to console (in production, save to database)
    console.log('URL Reported:', report);

    res.json({
      success: true,
      report,
      message: 'Report logged successfully. Please also submit to Google Safe Browsing and PhishTank manually.'
    });

  } catch (error) {
    console.error('Report submission error:', error.message);
    res.status(500).json({
      error: 'Report submission failed',
      details: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/expand-url',
      'POST /api/whois',
      'POST /api/ssl-check',
      'POST /api/safe-browsing',
      'POST /api/virus-total',
      'POST /api/analyze',
      'POST /api/report'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log(`QuishThis Backend Server v2.0.0`);
  console.log(`Running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('=================================\n');
  
  // Check API keys
  console.log('API Key Status:');
  console.log(`  Google Safe Browsing: ${API_KEYS.GOOGLE_SAFE_BROWSING !== 'YOUR_API_KEY' ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  WHOIS: ${API_KEYS.WHOIS !== 'YOUR_WHOIS_API_KEY' ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  VirusTotal: ${API_KEYS.VIRUS_TOTAL !== 'YOUR_VIRUSTOTAL_API_KEY' ? '✓ Configured' : '✗ Not configured'}`);
  console.log('\n');
});

module.exports = app;