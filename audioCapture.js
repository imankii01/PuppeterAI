const fs = require('fs');
const path = require('path');

async function captureAudio(page, duration = 30000) {
  return page.evaluate(async (recordingDuration) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = () => {
          resolve({
            buffer: reader.result,
            type: 'audio/webm'
          });
        };
        
        reader.readAsArrayBuffer(audioBlob);
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), recordingDuration);
    });
  }, duration);
}

function saveAudioFile(audioBuffer, format = 'webm') {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const audioPath = path.join(__dirname, `../recordings/meeting_${timestamp}.${format}`);
  
  fs.mkdirSync(path.dirname(audioPath), { recursive: true });
  fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
  
  return audioPath;
}

module.exports = { 
  captureAudio, 
  saveAudioFile 
};