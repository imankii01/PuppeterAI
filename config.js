module.exports = {
    meetBot: {
      recordingDuration: 30000,  // 30 seconds
      audioFormat: 'webm',
      transcriptionLanguage: 'en-US',
      muteMic: true,
      muteCamera: true
    },
    server: {
      port: process.env.PORT || 3000
    }
  };