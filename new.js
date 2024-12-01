const { chromium } = require('playwright');
const dotenv = require('dotenv');

class GoogleMeetBot {
  constructor(meetingLink, credentials) {
    this.meetingLink = meetingLink;
    this.credentials = credentials;
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Set to true for background operation
    });

    // Create a new browser context
    const context = await this.browser.newContext({
      permissions: ['camera', 'microphone']
    });

    // Create a new page
    this.page = await context.newPage();
  }

  async login() {
    try {
      // Navigate to Google login
      await this.page.goto('https://accounts.google.com/signin');

      // Enter email
      await this.page.fill('input[type="email"]', this.credentials.email);
      await this.page.click('#identifierNext');

      // Wait for password field
      await this.page.waitForSelector('input[type="password"]', { state: 'visible' });

      // Enter password
      await this.page.fill('input[type="password"]', this.credentials.password);
      await this.page.click('#passwordNext');

      // Wait for login to complete
      await this.page.waitForNavigation();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async joinMeeting() {
    try {
      // Navigate to meeting link
      await this.page.goto(this.meetingLink);

      // Wait for meeting page to load
      await this.page.waitForSelector('button[aria-label="Join call"]', { timeout: 10000 });

      // Disable microphone
      await this.page.click('button[aria-label="Turn off microphone"]', { timeout: 5000 }).catch(() => {});

      // Disable camera
      await this.page.click('button[aria-label="Turn off camera"]', { timeout: 5000 }).catch(() => {});

      // Join meeting
      await this.page.click('button[aria-label="Join call"]');

      // Wait for meeting interface
      await this.page.waitForSelector('div[role="main"]', { timeout: 15000 });

      console.log('Successfully joined Google Meet');
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  }

  async stayInMeeting(duration = 3600000) { // Default 1 hour
    console.log(`Staying in meeting for ${duration / 1000 / 60} minutes`);
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  async leaveMeeting() {
    try {
      // Click leave button
      await this.page.click('button[aria-label="Leave call"]');

      // Confirm leave
      await this.page.click('button:has-text("Leave")');
    } catch (error) {
      console.error('Error leaving meeting:', error);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run(duration = 3600000) {
    try {
      await this.initialize();
      await this.login();
      await this.joinMeeting();
      await this.stayInMeeting(duration);
      await this.leaveMeeting();
    } catch (error) {
      console.error('Meeting bot failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Usage example
async function main() {
  // Create .env file with these credentials
  dotenv.config();

  const bot = new GoogleMeetBot(
    'https://meet.google.com/your-meeting-link', 
    {
      email: process.env.email,
      password: process.env.password
    }
  );

  await bot.run();
}

main().catch(console.error);

module.exports = GoogleMeetBot;