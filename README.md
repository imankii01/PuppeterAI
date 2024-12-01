
---

# **🚀 Ultimate Google Meet Auto-Joiner Bot**

> *“Why join meetings manually when you can automate the chaos?”*  
> A bot so intelligent, it joins your Google Meet sessions **on time**, **without hassle**, and maybe even better dressed than you!

---

## **🤖 What Does This Bot Do?**

- Logs into your Google account (with **OAuth2 magic** ✨).
- Fetches Google Meet invites from **your calendar** like a personal secretary.
- Joins Google Meet calls with the punctuality of a Swiss watch. 🕒
- **Skips verification codes** because seriously, who has time for that? (Thanks, OAuth2).
- **Never forgets cookies** — saves them for smooth automation.
- Silently joins meetings and listens... or *notifies* you if things get too boring. 💤

---

## **⚙️ Installation Guide**

1. **Clone the Bot**  
   ```bash
   git clone https://github.com/YourCoolRepo/meet-auto-bot.git
   cd meet-auto-bot
   ```

2. **Install Dependencies**  
   ```bash
   npm install
   ```

3. **Setup Google Cloud Project**  
   - Get your **OAuth2 credentials**.
   - Enable **Google Calendar API** because meetings don’t magically exist.
   - Save your `client_secret.json` in the project folder.

4. **Run It Once (Manual Cookie Collector)**  
   ```bash
   node collectCookies.js
   ```
   - This will open Google login in a browser. Log in. Save cookies. Enjoy life. ☕

---

## **🚀 How It Works**

1. **Google Calendar Magic**  
   - Bot syncs with your Google Calendar.  
   - It reads invites and fetches all Google Meet links, like a super-spy cracking codes. 🕵️

2. **Smart Puppeteer Automation**  
   - Logs into Google Meet using **saved cookies**.  
   - Joins meetings silently — or with flair, depending on your mood.

3. **Built-in Recovery**  
   - If the meeting changes its link, it finds it again like a detective tracking clues.

4. **Error-Free (Mostly)**  
   - If it breaks, well… blame the humans. 🙃

---

## **🛠️ Commands**

- **Start the Bot**:  
  ```bash
  node index.js
  ```
- **Reset Cookies**:  
  ```bash
  node resetCookies.js
  ```

- **Fetch Calendar Events Only**:  
  ```bash
  node fetchEvents.js
  ```

---

## **👨‍💻 Configuration**

Edit the `.env` file:  
```env
EMAIL=<Your Google Email>
PASSWORD=<But seriously, don't put your password here>
PORT=3000
```

If you're using **OAuth2** (you totally should):  
- Add your `client_secret.json` file.  
- Run the bot. Let it ask for your permission. Relax.

---

## **😂 Known Issues**

1. **If Google asks for verification codes:**  
   Just tell it to chill — you're using OAuth2, after all.  

2. **Browser crashes on some systems:**  
   Try running with `--no-sandbox`. Puppeteer can be a diva sometimes.

3. **It joined the wrong meeting:**  
   Not the bot's fault. Your calendar is probably haunted.  

---

## **📅 Use Case Ideas**

- **Meeting Ninja**: For when you want to ghost join and lurk silently.  
- **Meeting Reminder**: Let the bot remind you when it's time for action.  
- **Note-Taking Bot**: Extend it to record meeting minutes (or memes).  

---

## **💡 Contributing**

Feel free to fork this bot and make it **smarter**, **lazier**, or just funnier. 😎  
PRs are welcome, especially those that add memes or animations.

---

## **🎉 Fun Facts**

- This bot has a 99% meeting join success rate — higher than most humans.  
- **"Join now" button detection** is smarter than a cat spotting food.  
- It uses cookies better than any 🍪 monster.

---

## **License**

MIT License. Use responsibly, and don't let your bot attend meetings *you* wouldn't. 😉  

---

Enjoy automating! 🎯
