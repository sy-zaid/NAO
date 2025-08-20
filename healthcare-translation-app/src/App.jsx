import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import LanguageSelector from "./components/LanguageSelector";
import TranscriptBox from "./components/TranscriptBox";
import ControlButtons from "./components/ControlButtons";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import "./App.css";

/**
 * Main application component that orchestrates the speech translation workflow.
 * Manages language settings, notification system, and coordinates between UI components
 * and the speech recognition hook.
 */
function App() {
  const [inputLanguage, setInputLanguage] = useState("en-US");
  const [outputLanguage, setOutputLanguage] = useState("en");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  /**
   * Custom hook that handles speech recognition, translation, and text processing
   * @param {string} inputLanguage - BCP 47 language tag for speech recognition
   * @param {string} outputLanguage - Target language for translation
   * @param {function} showNotification - Callback for displaying user notifications
   */
  const {
    isListening,
    transcript,
    translatedText,
    startListening,
    stopListening,
    clearText,
    speakTranslation,
    copyTranslation,
  } = useSpeechRecognition(inputLanguage, outputLanguage, showNotification);

  /**
   * Displays a temporary notification to the user
   * @param {string} message - Notification content to display
   * @param {string} type - Notification type: 'info', 'warning', 'error', or 'success'
   */
  function showNotification(message, type = "info") {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  }

  return (
    <div className="App">
      <Header />

      <main className="container">
        <div className="instructions">
          <h3>Instructions</h3>
          <p>1. Select your language and the target translation language</p>
          <p>2. Click "Start Listening" to begin speech recognition</p>
          <p>3. Speak clearly into your microphone</p>
          <p>4. View the original and translated text in real-time</p>
          <p>5. Use the "Speak" button to hear the translation</p>
        </div>

        <div className="card">
          <h2>Language Settings</h2>
          <LanguageSelector
            inputLanguage={inputLanguage}
            outputLanguage={outputLanguage}
            onInputLanguageChange={setInputLanguage}
            onOutputLanguageChange={setOutputLanguage}
          />

          <ControlButtons
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
            onClearText={clearText}
          />
        </div>

        <div className="card">
          <h2>Translation</h2>
          <div className="transcript-container">
            <TranscriptBox
              title="Original Text"
              content={transcript}
              status={isListening ? "Listening..." : "Inactive"}
              isListening={isListening}
            />
            <TranscriptBox
              title="Translated Text"
              content={translatedText}
              showActions={true}
              onSpeak={speakTranslation}
              onCopy={copyTranslation}
              isTranslated={true}
            />
          </div>
        </div>

        <div className="medical-terms">
          <h4>Medical Terminology Support</h4>
          <p>
            This app is optimized for medical terminology. Try phrases like:
          </p>
          <ul>
            <li>"I have a headache and fever"</li>
            <li>"My stomach hurts after eating"</li>
            <li>"I need to refill my prescription"</li>
            <li>"I'm allergic to penicillin"</li>
          </ul>
        </div>
      </main>

      <footer>
        <div className="container">
          <div className="footer-content">
            <p>MediTranslate - Healthcare Translation App</p>
            <p>Built with Web Speech API and SpeechSynthesis API</p>
          </div>
        </div>
      </footer>

      <div className={`notification ${notification.show ? "show" : ""}`}>
        <p>{notification.message}</p>
      </div>
    </div>
  );
}

export default App;