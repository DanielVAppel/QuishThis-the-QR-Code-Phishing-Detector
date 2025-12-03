YOUTUBE VIDEO LINK -> https://youtu.be/SyWCBadpYAA

Steps on how to run:

1. Open two terminals and cd to the quishThis folder for both: cd quishThis
2. (install dependencies first time) type in the command -> npm install
    
    *(Make sure API Keys are added to the .env file in the quishThis folder)
3. In the first terminal type in the command -> npm run server
4. In the second terminal type in the command -> npm start

    *(make sure that you have the expo go app already installed)
5. scan the QR code with your camera and then scan a QR code through the program.

File structure:
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


