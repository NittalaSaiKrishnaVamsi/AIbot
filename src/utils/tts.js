let speechInstance = null;
let isMuted = false; // Track mute state

export const speakText = (text) => {
    if (isMuted) return; // If muted, do not speak

    const synth = window.speechSynthesis;

    // Stop any ongoing speech
    if (speechInstance) {
        synth.cancel();
    }

    // Create a new speech instance
    speechInstance = new SpeechSynthesisUtterance(text);
    speechInstance.lang = 'en-US';
    speechInstance.rate = 1;
    speechInstance.pitch = 1;

    synth.speak(speechInstance);
};

// Function to toggle mute state
export const toggleMute = () => {
    isMuted = !isMuted;

    // Stop speaking if mute is enabled
    if (isMuted && speechInstance) {
        window.speechSynthesis.cancel();
    }

    return isMuted;
};
