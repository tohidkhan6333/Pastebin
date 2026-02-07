const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

// Health check for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Increase max event listeners
require('events').EventEmitter.defaultMaxListeners = 100;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static HTML routes
app.get('/pair', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/qr', (req, res) => {
  res.sendFile(path.join(__dirname, 'qr.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

// Serve static CSS/JS
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Load routers with error handling
try {
  const qrRouter = require('./qr');
  app.use('/qr', qrRouter);
  console.log('✅ QR router loaded');
} catch (error) {
  console.error('❌ Failed to load QR router:', error.message);
  app.get('/qr', (req, res) => {
    res.status(503).send('QR service is starting...');
  });
}

try {
  const codeRouter = require('./pair');
  app.use('/code', codeRouter);
  console.log('✅ Pair router loaded');
} catch (error) {
  console.error('❌ Failed to load Pair router:', error.message);
  app.get('/code', (req, res) => {
    res.status(503).send('Pairing service is starting...');
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;