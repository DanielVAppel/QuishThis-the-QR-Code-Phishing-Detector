# QuishThis - Advanced QR Code Phishing Detector v2.0

<div align="center">

![QuishThis Logo](./assets/shield.png)

**Protect yourself from malicious QR codes with AI-powered security analysis**

[Features](#features) • [Installation](#installation) • [Architecture](#architecture) • [API Setup](#api-setup) • [Usage](#usage)

</div>

---

## 🎥 Demo

[YouTube Demo](https://youtu.be/SyWCBadpYAA)

## ✨ Features

### Core Security Checks
- ✅ **URL Shortener Expansion** - Automatically expands bit.ly, tinyurl, etc.
- ✅ **Google Safe Browsing Integration** - Checks against Google's threat database
- ✅ **Domain Reputation Analysis** - WHOIS lookup for domain age and registrar
- ✅ **SSL/TLS Certificate Validation** - Verifies HTTPS and certificate validity
- ✅ **Typosquatting Detection** - Identifies brand impersonation attempts
- ✅ **Phishing Pattern Recognition** - Heuristic-based suspicious pattern detection
- ✅ **Malicious Link Reporting** - Submit threats to security organizations

### Technical Features
- 🏗️ **Modular Architecture** - Strategy, Facade, Observer, and Singleton patterns
- 💾 **Intelligent Caching** - 1-hour cache with Flyweight pattern for performance
- 🚀 **Backend Server** - Express.js server for heavy computations
- ⚡ **Parallel Processing** - All security checks run simultaneously
- 📊 **Risk Scoring** - 0-100 composite risk assessment
- 🎨 **Minecraft-Themed UI** - Fun and engaging user experience

---

## 📋 Prerequisites

- **Node.js** v18 or newer
- **npm** or yarn
- **Expo Go** app on your mobile device
- **API Keys** (optional but recommended - see [API Setup](#api-setup))

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/DanielVAppel/QuishThis-the-QR-Code-Phishing-Detector.git
cd QuishThis-the-QR-Code-Phishing-Detector/quishThis
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Keys (Optional)
Create a `.env` file in the project root:
```env
GOOGLE_SAFE_BROWSING_API_KEY=your_key_here
WHOIS_API_KEY=your_key_here
VIRUS_TOTAL_API_KEY=your_key_here
```

See [API_SETUP_GUIDE.md](./API_SETUP_GUIDE.md) for detailed instructions.

### 4. Start the Backend Server (Optional)
```bash
npm run server
```

The server will run on `http://localhost:3000`

### 5. Start the Mobile App
```bash
npm start
```

### 6. Scan QR Code with Expo Go
1. Open **Expo Go** on your phone
2. Scan the QR code from your terminal
3. Grant camera permissions
4. Start scanning QR codes!

---

## 🏗️ Architecture

### Design Patterns Implemented

#### 1. **Strategy Pattern** (analysisStrategies.js)
Each security check is encapsulated in its own strategy:
```javascript
- SafeBrowsingStrategy
- URLExpansionStrategy
- DomainReputationStrategy
- SSLValidationStrategy
- TyposquattingStrategy
- PhishingPatternStrategy
```

#### 2. **Facade Pattern** (urlAnalyzer.js)
Provides a simplified interface to complex security subsystems:
```javascript
const results = await urlAnalyzer.analyze(url);
```

#### 3. **Observer Pattern** (reportingService.js)
Notifies subscribers of reporting status changes:
```javascript
reportingService.subscribe((status) => {
  console.log('Report status:', status);
});
```

#### 4. **Singleton Pattern**
- `urlAnalyzer` - Single instance with shared cache
- `reportingService` - Single instance for centralized reporting

#### 5. **Flyweight Pattern**
Intelligent caching system reduces memory usage and API calls:
- 1-hour TTL (Time To Live)
- 100-entry cache limit
- Automatic eviction of oldest entries

---

## 📁 Project Structure

```
quishThis/
├── App.js                      # Main entry point
├── config.js                   # Centralized API configuration
├── server.js                   # Backend Express server
├── components/
│   ├── HomeScreen.js          # Minecraft-themed landing screen
│   ├── QRScanner.js           # QR scanning interface
│   └── SafetyResults.js       # Results display component
├── utils/
│   ├── urlChecker.js          # Main orchestrator
│   ├── urlAnalyzer.js         # Facade pattern implementation
│   ├── analysisStrategies.js  # All security check strategies
│   ├── reportingService.js    # Observer pattern for reporting
│   └── permissionUtils.js     # Camera permission handling
├── assets/                     # Images, fonts, icons
└── .env                       # API keys (create this)
```

---

## 🔍 How It Works

### 1. QR Code Scan
User scans a QR code → App extracts URL → Quick safety check

### 2. Comprehensive Analysis
Six parallel security checks:
1. **URL Expansion** - Unshorten URLs
2. **Google Safe Browsing** - Check threat database
3. **Domain Reputation** - WHOIS lookup
4. **SSL Validation** - Certificate check
5. **Typosquatting** - Brand impersonation detection
6. **Phishing Patterns** - Heuristic analysis

### 3. Risk Assessment
```javascript
const riskScore = calculateRiskScore(checks);
// 0-10: Safe
// 10-25: Caution
// 25-50: Suspicious
// 50+: Dangerous
```

### 4. User Decision
- **Safe**: Open URL button
- **Suspicious**: Warning + proceed anyway option
- **Dangerous**: Blocked with report option

---

## 🔐 Security Checks Explained

### URL Shortener Expansion
**What:** Expands bit.ly, tinyurl, etc. to reveal actual destination
**Why:** Attackers hide malicious URLs behind shorteners
**Tech:** Follows HTTP redirects (max 5 hops)

### Google Safe Browsing
**What:** Checks against Google's database of malicious sites
**Why:** Most comprehensive threat database available
**Tech:** Safe Browsing API v4

### Domain Reputation
**What:** Analyzes domain age, registrar, and history
**Why:** New domains (< 30 days) are often malicious
**Tech:** WHOIS API + heuristic analysis

### SSL/TLS Validation
**What:** Verifies HTTPS and certificate validity
**Why:** Legitimate sites use valid SSL certificates
**Tech:** Certificate chain validation

### Typosquatting Detection
**What:** Identifies domains mimicking popular brands
**Why:** paypa1.com vs paypal.com (note the "1")
**Tech:** Levenshtein distance + VirusTotal API

### Phishing Pattern Recognition
**What:** Detects suspicious URL patterns
**Why:** "urgent-account-verify.com" is suspicious
**Tech:** Keyword analysis, TLD checking, URL structure

---

## 🛡️ Reporting Malicious URLs

QuishThis helps you report threats to:

1. **Google Safe Browsing** - Automated where possible
2. **PhishTank** - Community-driven reporting
3. **APWG** - Anti-Phishing Working Group
4. **US-CERT** - Cybersecurity & Infrastructure Security Agency

The app provides:
- Manual submission instructions
- One-tap links to reporting forms
- Export reports as JSON/CSV

---

## 📊 API Integration

### Recommended APIs (with fallbacks)

| API | Purpose | Free Tier | Fallback |
|-----|---------|-----------|----------|
| Google Safe Browsing | Malware detection | 10k/day | Heuristic analysis |
| WhoisXMLAPI | Domain age | 500/month | Basic heuristics |
| VirusTotal | Typosquatting | 500/day | Levenshtein distance |
| URLScan.io | Screenshots | Unlimited | N/A |

**The app works without any API keys** - it just uses heuristic fallbacks.

---

## 🧪 Testing

### Test QR Codes

Create QR codes for these URLs to test:

1. **Safe URL**: `https://www.google.com`
2. **Shortened URL**: `https://bit.ly/3xyz` (any bit.ly link)
3. **HTTP (not HTTPS)**: `http://example.com`
4. **IP Address**: `http://192.168.1.1`
5. **Typosquatting**: `https://paypa1.com` (fake)
6. **Phishing Test**: `http://testsafebrowsing.appspot.com/s/phishing.html`

### Test Server Endpoints

```bash
# Health check
curl http://localhost:3000/health

# URL expansion
curl -X POST http://localhost:3000/api/expand-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://bit.ly/3xyz"}'

# Safe Browsing
curl -X POST http://localhost:3000/api/safe-browsing \
  -H "Content-Type: application/json" \
  -d '{"url":"http://malware.testing.google.test/testing/malware/"}'
```

---

## 🐛 Troubleshooting

### "Failed to download remote update"
```bash
# Clear cache and restart
npx expo start --clear
```

### "Camera permission denied"
1. Go to Settings → Apps → Expo Go → Permissions
2. Enable Camera
3. Restart app

### "API key not configured"
1. Check `.env` file exists in project root
2. Verify API keys are correct
3. Restart server: `npm run server`

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 🔮 Future Enhancements

- [ ] **Offline Mode** - Cached security databases
- [ ] **Historical Scans** - Track previously scanned QR codes
- [ ] **Custom Blocklist/Allowlist** - User-defined rules
- [ ] **Share Reports** - Send analysis to contacts
- [ ] **Dark Mode** - Alternative UI theme
- [ ] **Multi-language Support** - Internationalization
- [ ] **QR Code Generation** - Create safe QR codes
- [ ] **Browser Extension** - Desktop protection

---


## 👤 Author

**Daniel Appel**
- GitHub: [@DanielVAppel](https://github.com/DanielVAppel)
- Project: CS 6640 Graduate Seminar

---

## 🙏 Acknowledgments

### Research Sources
- Google Safe Browsing API Documentation
- APWG Phishing Activity Trends Reports
- QR Code Security Research Papers
- Expo and React Native Communities

### Tools & Libraries
- **Expo** - React Native framework
- **Express.js** - Backend server
- **Axios** - HTTP client
- **React Native** - Mobile framework

---

## 📚 Documentation

- [API Setup Guide](./API_SETUP_GUIDE.md) - Detailed API configuration
- [YouTube Demo](https://youtu.be/SyWCBadpYAA) - Video walkthrough
- [Project Presentation](./CS%206640%20QuishThis%20Final%20Project.pdf) - Academic presentation

---

## ⚠️ Disclaimer

QuishThis is an educational project designed for basic QR code security checking. For enterprise-level security:

- Use professional security solutions
- Implement additional verification layers
- Regular security audits
- Employee training programs

**Never rely solely on automated tools for security decisions.**

---

## 📞 Support

Having issues? Check these resources:

1. [GitHub Issues](https://github.com/DanielVAppel/QuishThis/issues)
2. [API Setup Guide](./API_SETUP_GUIDE.md)
3. [Troubleshooting Section](#troubleshooting)
4. [Expo Documentation](https://docs.expo.dev/)

---

<div align="center">

**Made with ❤️ for a safer digital world**

⭐ Star this repo if QuishThis helped you stay safe!

</div>