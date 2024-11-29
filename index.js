const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Main API Endpoint
app.get("/join-meet", async (req, res) => {
  const meetId = req.query.meetId;

  if (!meetId) {
    return res
      .status(400)
      .json({ error: "Missing 'meetId' in query parameters." });
  }

  try {
    await startGoogleMeetBot(meetId);
    res
      .status(200)
      .json({
        message: `Successfully attempted to join the meeting with ID: ${meetId}`
      });
  } catch (error) {
    console.error("Error occurred while joining the Google Meet:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
});

async function startGoogleMeetBot(meetCode) {
  // Google Meet code

  // Launch the browser with desired settings
  const browser = await puppeteer.launch({
    headless: process.env.headless,
    args: [
      "--disable-notifications",
      "--enable-automation",
      "--start-maximized",
      "--use-fake-ui-for-media-stream", // Automatically grant media permissions
      "--enable-usermedia-screen-capturing"
    ],
    ignoreDefaultArgs: false
  });

  const [page] = await browser.pages();

  // Navigate to Google sign-in page
  await page.goto("https://accounts.google.com");

  // Set browser permissions
  const context = browser.defaultBrowserContext();
  await context.clearPermissionOverrides();
  await context.overridePermissions(`https://meet.google.com/${meetCode}`, [
    "camera",
    "microphone",
    "notifications"
  ]);

  // Log in to Google account
  await signInToGoogle(page);

  // Navigate to Google Meet link
  await page.goto(`https://meet.google.com/${meetCode}`);

  // Mute camera and microphone, then join the meeting
  await muteCameraAndMicrophone(page);
  await joinMeeting(page);
  // Start recording audio here (you'd need a mechanism to capture this).
  await startAudioCapture(page);
}

async function signInToGoogle(page) {
  // Wait for email input and type the email
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', process.env.email);

  // Click the "Next" button
  const nextButton = await page.$x("//span[contains(text(), 'Next')]");
  if (nextButton.length > 0) {
    await nextButton[0].click();
  } else {
    console.error('Button with text "Next" not found.');
  }

  // Wait for password input, then type the password
  await page.waitForTimeout(3500);
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', process.env.password);

  // Click the "Next" button again
  const nextButtonPassword = await page.$x("//span[contains(text(), 'Next')]");
  if (nextButtonPassword.length > 0) {
    await nextButtonPassword[0].click();
  } else {
    console.error('Button with text "Next" not found.');
  }

  // Wait for navigation to complete
  await page.waitForNavigation();
}

async function muteCameraAndMicrophone(page) {
  // Wait for and click microphone mute button
  await page.waitForSelector(
    ".U26fgb.JRY2Pb.mUbCce.kpROve.yBiuPb.y1zVCf.M9Bg4d.HNeRed"
  );
  await page.click(".U26fgb.JRY2Pb.mUbCce.kpROve.yBiuPb.y1zVCf.M9Bg4d.HNeRed");

  // Wait for and click camera off button
  await page.waitForSelector(
    ".U26fgb.JRY2Pb.mUbCce.kpROve.yBiuPb.y1zVCf.M9Bg4d.HNeRed"
  );
  await page.click(".U26fgb.JRY2Pb.mUbCce.kpROve.yBiuPb.y1zVCf.M9Bg4d.HNeRed");
}

async function joinMeeting(page) {
  // Wait and try to click "Ask to join" or "Join now" button
  await page.waitForTimeout(2500);
  const askToJoinButton = await page.$x(
    "//span[contains(text(), 'Ask to join')]"
  );
  if (askToJoinButton.length > 0) {
    await askToJoinButton[0].click();
  } else {
    const joinNowButton = await page.$x("//span[contains(text(), 'Join now')]");
    if (joinNowButton.length > 0) {
      await joinNowButton[0].click();
    } else {
      console.error('Button with text "Join Now" not found.');
    }
  }
}

async function startAudioCapture(page) {
  // Inject the WebRTC script into the browser
  await page.evaluate(async () => {
    const audioChunks = [];
    let mediaRecorder;

    try {
      // Request access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) {
          console.error("No audio chunks captured.");
          return;
        }

        // Create a Blob from the audio chunks
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        // Save the Blob as a file
        const reader = new FileReader();
        reader.onloadend = () => {
          const buffer = new Uint8Array(reader.result);
          console.log("Audio buffer size:", buffer.length); // Debug log
          window.audioBuffer = buffer; // Save to window for Puppeteer to access
        };
        reader.readAsArrayBuffer(audioBlob);
      };

      // Start recording for 10 seconds
      mediaRecorder.start();
      console.log("Recording started...");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Record for 10 seconds
      mediaRecorder.stop();
      console.log("Recording stopped.");
    } catch (error) {
      console.error("Error in audio capture:", error);
      throw error;
    }
  });

  // Retrieve the audio buffer from the browser
  const audioBuffer = await page.evaluate(() => window.audioBuffer);
  if (!audioBuffer) {
    throw new Error("Audio buffer is undefined. Check browser capture logic.");
  }

  // Save the buffer to a file in Node.js
  const audioPath = "./audio.webm";
  fs.writeFileSync(audioPath, Buffer.from(audioBuffer));

  console.log("Audio saved to:", audioPath);

  // Transcribe the audio
  // await transcribeAudio(audioPath);
}

// Transcription function using Google Cloud Speech-to-Text
async function transcribeAudio(audioPath) {
  const audio = {
    content: fs.readFileSync(audioPath).toString("base64")
  };

  const config = {
    encoding: "LINEAR16", // Update encoding based on your audio format
    sampleRateHertz: 16000, // Update based on your audio's sample rate
    languageCode: "en-US"
  };

  const request = {
    audio: audio,
    config: config
  };

  try {
    const [response] = await client.recognize(request);
    console.log(
      "Transcript:",
      response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n")
    );
  } catch (error) {
    console.error("Error during transcription:", error);
  }
}
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
