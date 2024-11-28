const puppeteer = require("puppeteer");

async function joinGoogleMeet(meetUrl, userEmail, userPassword) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--use-fake-ui-for-media-stream",
      "--enable-usermedia-screen-capturing",
      "--start-maximized",
    ],
  });

  const page = await browser.newPage();

  try {
    // Go to Google login page
    await page.goto("https://accounts.google.com");

    // Wait for email input and enter the email
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', userEmail);
    await page.click("#identifierNext");

    // Wait for password input and enter the password
    await page.waitForSelector('input[type="password"]', { visible: true, timeout: 10000 });
    await page.type('input[type="password"]', userPassword);
    await page.click("#passwordNext");

    // Wait for the Google Meet URL to load
    console.log("Logging in and navigating to Google Meet...");
    await page.goto(meetUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    try {
      // Wait for the "Join now" button to appear and click it
      await page.waitForSelector("button[aria-label='Join now']", { timeout: 10000 });
      await page.click("button[aria-label='Join now']");
      console.log("Bot has joined the Google Meet successfully.");
    } catch (joinError) {
      console.log("Join button not found. Trying to enter a name...");

      // If "Join now" isn't found, check for name input field
      try {
        await page.waitForSelector('input[aria-label="Enter your name"]', { timeout: 5000 });
        await page.type('input[aria-label="Enter your name"]', 'Bot User');
        await page.waitForSelector("button[aria-label='Join now']", { timeout: 5000 });
        await page.click("button[aria-label='Join now']");
        console.log("Bot has joined the Google Meet after entering the name.");
      } catch (innerError) {
        console.error("Failed to join the meeting after entering name: ", innerError.message);
      }
    }
  } catch (error) {
    console.error("An error occurred during the process: ", error.message);
  } finally {
    // Ensure browser is closed even if there’s an error
    await browser.close();
  }
}

const meetUrl = "https://meet.google.com/dge-dfcs-ywu?authuser=0"; // Replace with your Google Meet URL
const userEmail = "testingankit047@gmail.com";
const userPassword = "121102@aA"; // Replace with your Google account password

joinGoogleMeet(meetUrl, userEmail, userPassword);
