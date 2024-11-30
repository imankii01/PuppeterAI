const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Server Status</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 50px;
          }
          .status {
            font-size: 1.5em;
            color: green;
          }
        </style>
      </head>
      <body>
        <h1>Server is Live!</h1>
        <p class="status">Your Node.js server is running successfully.</p>
      </body>
    </html>
  `;
  res.status(200).send(htmlContent);
});

app.get("/join-meet", async (req, res) => {
  const meetId = req.query.meetId;

  if (!meetId) {
    return res
      .status(400)
      .json({ error: "Missing 'meetId' in query parameters." });
  }

  try {
    await startGoogleMeetBot(meetId);
    res.status(200).json({
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
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome', // Adjust based on Step 2 output
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-notifications",
      "--use-fake-ui-for-media-stream",
    ],
  });
  

  const [page] = await browser.pages();

  await page.goto("https://accounts.google.com");

  const context = browser.defaultBrowserContext();
  await context.clearPermissionOverrides();
  await context.overridePermissions(`https://meet.google.com/${meetCode}`, [
    "camera",
    "microphone",
    "notifications"
  ]);

  await signInToGoogle(page);

  await page.goto(`https://meet.google.com/${meetCode}`);

  await muteCameraAndMicrophone(page);
  await joinMeeting(page);
  await startAudioCapture(page);
}

async function signInToGoogle(page) {
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', process.env.email);

  const nextButton = await page.$x("//span[contains(text(), 'Next')]");
  if (nextButton.length > 0) {
    await nextButton[0].click();
  } else {
    console.error('Button with text "Next" not found.');
  }

  await page.waitForTimeout(3500);
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', process.env.password);

  const nextButtonPassword = await page.$x("//span[contains(text(), 'Next')]");
  if (nextButtonPassword.length > 0) {
    await nextButtonPassword[0].click();
  } else {
    console.error('Button with text "Next" not found.');
  }

  await page.waitForNavigation();
}

async function muteCameraAndMicrophone(page) {
  await page.waitForSelector(
    ".U26fgb.JRY2Pb.mUbCce.kpROve.yBiuPb.y1zVCf.M9Bg4d.HNeRed"
  );
  await page.click(".U26fgb.JRY2Pb.mUbCce.kpROve.yBiuPb.y1zVCf.M9Bg4d.HNeRed");

  await page.waitForSelector(
    ".U26fgb.JRY2Pb.mUbCce.kpROve.yBiuPb.y1zVCf.M9Bg4d.HNeRed"
  );
  await page.click(".U26fgb.JRY2Pb.mUbCce.kpROve.yBiuPb.y1zVCf.M9Bg4d.HNeRed");
}

async function joinMeeting(page) {
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
  await page.evaluate(async () => {
    const audioChunks = [];
    let mediaRecorder;

    try {
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

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        const reader = new FileReader();
        reader.onloadend = () => {
          const buffer = new Uint8Array(reader.result);
          console.log("Audio buffer size:", buffer.length);
          window.audioBuffer = buffer;
        };
        reader.readAsArrayBuffer(audioBlob);
      };

      mediaRecorder.start();
      console.log("Recording started...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      mediaRecorder.stop();
      console.log("Recording stopped.");
    } catch (error) {
      console.error("Error in audio capture:", error);
      throw error;
    }
  });

  const audioBuffer = await page.evaluate(() => window.audioBuffer);
  if (!audioBuffer) {
    throw new Error("Audio buffer is undefined. Check browser capture logic.");
  }

  const audioPath = "./audio.webm";
  fs.writeFileSync(audioPath, Buffer.from(audioBuffer));

  console.log("Audio saved to:", audioPath);
  // await transcribeAudio(audioPath);
}

async function transcribeAudio(audioPath) {
  const audio = {
    content: fs.readFileSync(audioPath).toString("base64")
  };

  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
