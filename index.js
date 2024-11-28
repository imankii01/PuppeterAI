const puppeteer = require("puppeteer");

async function joinGoogleMeet(meetUrl, userEmail, userPassword) {
  const browser = await puppeteer.launch({
    headless: false,
    // executablePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    args: [
      "--use-fake-ui-for-media-stream",
      "--enable-usermedia-screen-capturing",
      "--start-maximized"
    ],
  });

  const page = await browser.newPage();

  await page.goto("https://accounts.google.com");

  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', userEmail);
  await page.click("#identifierNext");

  await page.waitForSelector('input[type="password"]', { visible: true });
  await page.type('input[type="password"]', userPassword);
  await page.click("#passwordNext");

  try {
    await page.goto(meetUrl);
    await page.waitForSelector("button[aria-label='Join now']", { timeout: 5000 });
    await page.click("button[aria-label='Join now']");
    console.log("Bot has joined the Google Meet");
  } catch (error) {
    if (error.name === 'TimeoutError') {
      try {
        await page.waitForSelector('input[aria-label="Enter your name"]', { timeout: 5000 });
        await page.type('input[aria-label="Enter your name"]', 'Bot User');
        await page.waitForSelector("button[aria-label='Join now']", { timeout: 5000 });
        await page.click("button[aria-label='Join now']");
        console.log("Bot has joined the Google Meet after entering name");
      } catch (innerError) {
        console.error("Failed to join the meeting after entering name: ", innerError.message);
      }
    } else {
      console.error("Failed to join the meeting: ", error.message);
    }
  }

  await browser.close();
}

const meetUrl = "https://meet.google.com/dge-dfcs-ywu?authuser=0";
const userEmail = "21cs34@lingayasvidyapeeth.edu.in";
const userPassword = "pswd2024";

joinGoogleMeet(meetUrl, userEmail, userPassword);
