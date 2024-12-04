const express = require('express');
const { google } = require('googleapis');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class GoogleMeetOAuthBot {
  constructor(options = {}) {
    this.app = express();
    this.app.use(express.json());

    // OAuth 2.0 Configuration
    this.credentials = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
    };

    // Scopes for Google Meet and Calendar access
    this.scopes = [
      'https://www.googleapis.com/auth/meetings',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    this.oauth2Client = new google.auth.OAuth2(
      this.credentials.clientId,
      this.credentials.clientSecret,
      this.credentials.redirectUri
    );

    this.initializeRoutes();
  }

  initializeRoutes() {
    // Generate OAuth URL
    this.app.get('/auth/google', (req, res) => {
      const authUrl = this.generateAuthUrl();
      res.redirect(authUrl);
    });

    // OAuth callback handler
    this.app.get('/oauth2callback', async (req, res) => {
      try {
        const { code } = req.query;
        if (!code) {
          return res.status(400).json({ error: 'No authorization code provided' });
        }

        const { tokens } = await this.oauth2Client.getToken(code);
        this.saveTokens(tokens);

        res.redirect('/auth/success');
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Join Meeting Endpoint
    this.app.post('/join-meeting', this.validateRequest.bind(this), this.handleMeetingJoin.bind(this));

    // Check Authentication Status
    this.app.get('/auth/status', (req, res) => {
      const tokens = this.loadTokens();
      res.json({
        authenticated: !!tokens,
        tokenExpiry: tokens ? new Date(tokens.expiry_date).toISOString() : null
      });
    });

    // Refresh Token Endpoint
    this.app.post('/auth/refresh', async (req, res) => {
      try {
        const newTokens = await this.refreshAccessToken();
        res.json({ message: 'Token refreshed successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  // Middleware to validate meeting join request
  validateRequest(req, res, next) {
    const { meetingLink, duration } = req.body;

    if (!meetingLink) {
      return res.status(400).json({ error: 'Meeting link is required' });
    }

    // Validate meeting link format
    const meetingUrlPattern = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/;
    if (!meetingUrlPattern.test(meetingLink)) {
      return res.status(400).json({ error: 'Invalid Google Meet link format' });
    }

    // Optional duration validation
    if (duration && (isNaN(duration) || duration < 60000 || duration > 3600000)) {
      return res.status(400).json({ 
        error: 'Duration must be a number between 60000ms (1 min) and 3600000ms (1 hour)' 
      });
    }

    next();
  }

  // Meeting join handler
  async handleMeetingJoin(req, res) {
    const { meetingLink, duration = 3600000, audioMuted = true, videoOff = true } = req.body;

    try {
      // Check for existing tokens
      const tokens = this.loadTokens();
      if (!tokens) {
        return res.status(401).json({ error: 'No authentication tokens. Please authenticate first.' });
      }

      // Start join process
      const joinResult = await this.joinMeeting(meetingLink, {
        duration,
        audioMuted,
        videoOff
      });

      res.json({ 
        message: 'Meeting joined successfully', 
        details: joinResult 
      });
    } catch (error) {
      console.error('Meeting join error:', error);
      res.status(500).json({ 
        error: 'Failed to join meeting', 
        details: error.message 
      });
    }
  }

  // Generate OAuth authorization URL
  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent'
    });
  }

  // Join Google Meet
  async joinMeeting(meetingLink, options = {}) {
    const { duration = 3600000, audioMuted = true, videoOff = true } = options;

    const browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null 
    });

    try {
      const page = await browser.newPage();

      // Navigate to meeting link
      await page.goto(meetingLink, { waitUntil: 'networkidle0' });

      // Wait for join button
      await page.waitForSelector('button[aria-label="Join call"]', { timeout: 10000 });
      
      // Optionally mute/disable video
      if (audioMuted) {
        await page.click('button[aria-label="Turn off microphone"]').catch(() => {});
      }
      if (videoOff) {
        await page.click('button[aria-label="Turn off camera"]').catch(() => {});
      }

      // Join meeting
      await page.click('button[aria-label="Join call"]');

      // Stay in meeting
      await new Promise(resolve => setTimeout(resolve, duration));

      return { 
        meetingLink, 
        joinedAt: new Date().toISOString(), 
        duration 
      };
    } catch (error) {
      console.error('Meeting join error:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  // Token management methods
  saveTokens(tokens) {
    const tokenPath = path.join(__dirname, 'token.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));
  }

  loadTokens() {
    const tokenPath = path.join(__dirname, 'token.json');
    return fs.existsSync(tokenPath) 
      ? JSON.parse(fs.readFileSync(tokenPath, 'utf8')) 
      : null;
  }

  async refreshAccessToken() {
    const tokens = this.loadTokens();
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    this.oauth2Client.setCredentials(tokens);
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    this.saveTokens(credentials);
    return credentials;
  }

  // Start the Express server
  start(port = 3000) {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          console.log(`Server running on port ${port}`);
          resolve(this.server);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Stop the server
  stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Export and usage
module.exports = (options) => {
  const meetBot = new GoogleMeetOAuthBot(options);
  return meetBot;
};

// Example usage in main application
if (require.main === module) {
  const app = express();
  const meetBot = module.exports();

  // Mount the meetBot routes
  app.use(meetBot.app);

  // Start the server
  meetBot.start(3000);
}