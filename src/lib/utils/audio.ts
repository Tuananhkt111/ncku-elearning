// Create a single reusable Audio instance
const notificationSound = new Audio('/sounds/notification.mp3');

export const playNotificationSound = () => {
  try {
    // Reset the audio to the beginning in case it was already playing
    notificationSound.currentTime = 0;
    
    // Set volume to a moderate level
    notificationSound.volume = 0.5;
    
    // Play the sound with a promise chain to handle autoplay restrictions
    const playPromise = notificationSound.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error('Error playing notification sound:', error);
      });
    }
  } catch (error) {
    console.error('Error initializing notification sound:', error);
  }
}; 