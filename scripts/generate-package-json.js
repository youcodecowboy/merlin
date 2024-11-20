const fs = require('fs');
const path = require('path');

// Import dependency configurations
const dependencies = require('../config/dependencies');
const devDependencies = require('../config/devDependencies');

// Create package.json content
const packageJson = {
  "name": "express-react-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "update-deps": "node scripts/generate-package-json.js"
  },
  "dependencies": {
    ...dependencies.core,
    ...dependencies.ui,
    ...dependencies.forms,
    ...dependencies.auth,
    ...dependencies.utils
  },
  "devDependencies": {
    ...devDependencies.typescript,
    ...devDependencies.build,
    ...devDependencies.css,
    "@types/qrcode": "^1.5.5"
  }
};

// Write to package.json
fs.writeFileSync(
  path.join(__dirname, '..', 'package.json'),
  JSON.stringify(packageJson, null, 2)
);