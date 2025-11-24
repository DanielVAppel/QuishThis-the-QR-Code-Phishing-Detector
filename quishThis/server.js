//run npm install express axios cors dotenv
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Safe Browsing API endpoint
app.post('/api/check-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Google Safe Browsing API call
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        client: { clientId: 'qr-safety-scanner', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      }
    );
    
    // Check if threats were found
    const isMalicious = response.data && 
                        response.data.matches && 
                        response.data.matches.length > 0;
    
    res.json({ isMalicious, details: isMalicious ? response.data.matches : [] });
  } catch (error) {
    console.error('Error checking URL:', error);
    res.status(500).json({ error: 'Failed to check URL' });
  }
});

// Domain WHOIS info endpoint
app.get('/api/domain-info/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    // Use a WHOIS API service here
    // This is just a placeholder
    res.json({ domain, age: 'Unknown', registrar: 'Unknown' });
  } catch (error) {
    console.error('Error fetching domain info:', error);
    res.status(500).json({ error: 'Failed to get domain info' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
