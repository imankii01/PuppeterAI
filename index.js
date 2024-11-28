const puppeteer = require('puppeteer-core');
const path = require('path');

async function joinGoogleMeet(meetUrl, userEmail, userPassword) {
  // Set the path to your installed browser (e.g., Chrome, Chromium, or Edge)
  const browserPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';  // Change this path if needed

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: browserPath,  // Path to your browser (e.g., Chrome/Edge)
    args: [
      '--use-fake-ui-for-media-stream',
      '--enable-usermedia-screen-capturing',
      '--start-maximized',
    ],
  });

  const page = await browser.newPage();

  try {
    console.log("Navigating to Google Login...");
    await page.goto('https://accounts.google.com', { waitUntil: 'domcontentloaded' });

    // Log in to Google Account
    console.log("Entering Google credentials...");
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', userEmail);
    await page.click('#identifierNext');

    // Wait for password field to appear
    await page.waitForSelector('input[type="password"]', { visible: true, timeout: 10000 });
    await page.type('input[type="password"]', userPassword);
    await page.click('#passwordNext');

    // Wait for successful login
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    console.log("Logged in successfully.");

    // Go to the Google Meet URL
    console.log("Navigating to the Google Meet URL...");
    await page.goto(meetUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Close any unnecessary popups that appear (e.g., permissions or notifications)
    try {
      console.log("Looking for popups...");
      await page.waitForSelector('button[aria-label="Close"]', { timeout: 5000 });
      await page.click('button[aria-label="Close"]');
      console.log("Popup closed.");
    } catch (popupError) {
      console.log("No popup found or it took too long to appear.");
    }

    // Check if we're already in the meeting (look for Join now button)
    try {
      console.log("Waiting for 'Join now' button...");
      await page.waitForSelector('button[aria-label="Join now"]', { timeout: 10000 });

      // If the button is found, click it to join the meeting
      console.log("Clicking the 'Join now' button...");
      await page.click('button[aria-label="Join now"]');
      console.log("Bot has joined the Google Meet successfully.");

    } catch (joinError) {
      console.log("Join button not found. Trying to enter a name...");

      // If no 'Join now' button, check if we need to enter a name
      try {
        console.log("Looking for the name input field...");
        await page.waitForSelector('input[aria-label="Enter your name"]', { timeout: 10000 });
        await page.type('input[aria-label="Enter your name"]', 'Bot User');
        console.log("Name entered. Now attempting to join...");

        await page.waitForSelector('button[aria-label="Join now"]', { timeout: 10000 });
        await page.click('button[aria-label="Join now"]');
        console.log("Bot has joined the Google Meet after entering the name.");

      } catch (innerError) {
        console.error("Failed to enter the name and join the meeting: ", innerError.message);
      }
    }

    // Optional: Check for microphone and camera buttons to mute and turn off video
    try {
      console.log("Checking if mic and camera need to be muted/off...");
      await page.waitForSelector('button[aria-label="Turn off microphone"]', { timeout: 5000 });
      await page.click('button[aria-label="Turn off microphone"]');
      console.log("Microphone turned off.");

      await page.waitForSelector('button[aria-label="Turn off camera"]', { timeout: 5000 });
      await page.click('button[aria-label="Turn off camera"]');
      console.log("Camera turned off.");
    } catch (mediaError) {
      console.log("Could not mute mic or turn off camera: ", mediaError.message);
    }

  } catch (error) {
    console.error("An error occurred during the process: ", error.message);
  } finally {
    console.log("Closing browser...");
    await browser.close();
  }
}

const meetUrl = "https://meet.google.com/dge-dfcs-ywu";  // Replace with the Google Meet URL
const userEmail = "21cs34@lingayasvidyapeeth.edu.in";  // Your Google account email
const userPassword = "pswd2024";  // Your Google account password

joinGoogleMeet(meetUrl, userEmail, userPassword);
