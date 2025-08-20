import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Medical terminology mapping for enhancing common terms with clinical equivalents
 * Used to improve accuracy and professionalism in medical documentation
 */
const medicalTermsMap = {
  headache: "cephalalgia",
  fever: "pyrexia",
  stomach: "abdomen",
  hurt: "pain",
  prescription: "medication order",
  allergic: "hypersensitivity",
  penicillin: "antibiotic",
  "blood pressure": "systolic and diastolic pressure",
  heartburn: "pyrosis",
  rash: "cutaneous eruption",
  dizzy: "vertigo",
  "throw up": "vomit",
  bruise: "contusion",
  "bug bite": "arthropod assault",
};

/**
 * Maps browser language codes to standardized codes for API compatibility
 * Handles regional variants (en-US → en, es-ES → es, etc.)
 */
const languageCodeMap = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  it: "it",
  pt: "pt",
  ru: "ru",
  zh: "zh",
  ja: "ja",
  ar: "ar",
  "en-US": "en",
  "en-GB": "en",
  "es-ES": "es",
  "fr-FR": "fr",
  "de-DE": "de",
  "it-IT": "it",
  "pt-PT": "pt",
  "pt-BR": "pt",
  "zh-CN": "zh",
  "ja-JP": "ja",
  "ar-SA": "ar",
};

/**
 * Supported language translation pairs for MyMemory API
 * Defines which language combinations are available for translation
 */
const supportedLanguagePairs = {
  en: ["es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ar"],
  es: ["en", "fr", "de", "it", "pt"],
  fr: ["en", "es", "de", "it", "pt"],
  de: ["en", "es", "fr", "it", "pt"],
  it: ["en", "es", "fr", "de", "pt"],
  pt: ["en", "es", "fr", "de", "it"],
  ru: ["en"],
  zh: ["en"],
  ja: ["en"],
  ar: ["en"],
};

/**
 * Sanitizes input strings to prevent XSS attacks
 * Removes HTML tags, JavaScript protocols, and dangerous attributes
 * @param {string} input - Raw user input to sanitize
 * @returns {string} Sanitized safe string
 */
const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";

  // Remove potentially dangerous characters and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/javascript:/gi, "")
    .replace(/onerror/gi, "")
    .replace(/onload/gi, "")
    .replace(/onclick/gi, "")
    .trim();
};

/**
 * Custom hook for speech recognition and medical translation
 * Provides real-time speech-to-text with medical terminology enhancement
 * and multi-language translation capabilities
 * @param {string} inputLanguage - Source language for speech recognition
 * @param {string} outputLanguage - Target language for translation
 * @param {function} showNotification - Callback for user notifications
 * @returns {Object} Speech recognition controls and state
 */
export const useSpeechRecognition = (
  inputLanguage,
  outputLanguage,
  showNotification
) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const recognitionRef = useRef(null);
  const inactivityTimerRef = useRef(null); // For automatic data clearing

  // --- SECURITY: HTTPS Enforcement ---
  useEffect(() => {
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      showNotification(
        "Warning: For patient security, please use HTTPS. Data transmission may not be secure.",
        "warning"
      );
    }
  }, [showNotification]);

  // --- SECURITY: Automatic Data Clearing ---
  useEffect(() => {
    // Reset inactivity timer whenever there's activity
    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Clear sensitive data after 5 minutes of inactivity
      inactivityTimerRef.current = setTimeout(() => {
        if (transcript || translatedText) {
          setTranscript("");
          setTranslatedText("");
          showNotification("Patient data cleared for security", "info");
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Set up event listeners for user activity
    const events = ["mousedown", "keypress", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // Start the initial timer

    // Clean up
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [transcript, translatedText, showNotification]);

  /**
   * Detects base language code from recognition language setting
   * @param {string} recognitionLang - Full language code from speech recognition
   * @returns {string} Standardized language code
   */
  const detectInputLanguage = (recognitionLang) => {
    const baseLang = recognitionLang.split("-")[0];
    return languageCodeMap[baseLang] || "en";
  };

  /**
   * Validates if a language pair is supported by the translation API
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {boolean} True if the language pair is supported
   */
  const isLanguagePairSupported = (sourceLang, targetLang) => {
    return supportedLanguagePairs[sourceLang]?.includes(targetLang) || false;
  };

  /**
   * Translates text using MyMemory API with fallback handling
   * Includes input sanitization and error handling
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code
   * @returns {Promise<string>} Translated text
   */
  const translateWithMyMemory = async (text, targetLang, sourceLang) => {
    // --- SECURITY: Sanitize input before sending to API ---
    const sanitizedText = sanitizeInput(text);

    // Don't translate if source and target languages are the same
    if (sourceLang === targetLang) {
      return sanitizedText;
    }

    // Check if language pair is supported
    if (!isLanguagePairSupported(sourceLang, targetLang)) {
      showNotification(
        `Translation from ${sourceLang} to ${targetLang} not supported. Using fallback.`,
        "warning"
      );
      return handleFallbackTranslation(sanitizedText, targetLang);
    }

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          sanitizedText
        )}&langpair=${sourceLang}|${targetLang}&de=your-email@example.com`
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.responseStatus === 200 &&
        data.responseData &&
        data.responseData.translatedText
      ) {
        // --- SECURITY: Sanitize API response ---
        return sanitizeInput(data.responseData.translatedText);
      } else {
        throw new Error(`Translation failed: ${data.responseStatus}`);
      }
    } catch (error) {
      console.error("Translation error:", error);
      showNotification(
        "Translation service unavailable. Using fallback.",
        "warning"
      );
      return handleFallbackTranslation(sanitizedText, targetLang);
    }
  };

  /**
   * Client-side fallback translation for common medical phrases
   * Used when API translation is unavailable
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @returns {string} Translated text
   */
  const clientSideFallback = (text, targetLang) => {
    // --- SECURITY: Sanitize input ---
    const sanitizedText = sanitizeInput(text);

    const commonTranslations = {
      en: {
        pain: "pain",
        headache: "headache",
        fever: "fever",
        help: "help",
        medicine: "medicine",
        doctor: "doctor",
        emergency: "emergency",
      },
      es: {
        pain: "dolor",
        headache: "dolor de cabeza",
        fever: "fiebre",
        help: "ayuda",
        medicine: "medicina",
        doctor: "médico",
        emergency: "emergencia",
        water: "agua",
        food: "comida",
      },
      fr: {
        pain: "douleur",
        headache: "mal de tête",
        fever: "fièvre",
        help: "aide",
        medicine: "médicament",
        doctor: "médecin",
        emergency: "urgence",
        water: "eau",
        food: "nourriture",
      },
      de: {
        pain: "schmerz",
        headache: "kopfschmerzen",
        fever: "fieber",
        help: "hilfe",
        medicine: "medizin",
        doctor: "arzt",
        emergency: "notfall",
        water: "wasser",
        food: "essen",
      },
    };

    const words = sanitizedText.toLowerCase().split(/\s+/);
    const translatedWords = words.map((word) => {
      const cleanWord = word.replace(/[.,!?;:]/g, "");
      return commonTranslations[targetLang]?.[cleanWord] || word;
    });

    return translatedWords.join(" ");
  };

  /**
   * Handles translation fallback with multiple strategies
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @returns {string} Translated text or fallback message
   */
  const handleFallbackTranslation = (text, targetLang) => {
    // --- SECURITY: Sanitize input ---
    const sanitizedText = sanitizeInput(text);

    const langNames = {
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      zh: "Chinese",
      ja: "Japanese",
      ar: "Arabic",
      en: "English",
    };

    // Try client-side fallback first
    const clientTranslated = clientSideFallback(sanitizedText, targetLang);
    if (clientTranslated !== sanitizedText.toLowerCase()) {
      return clientTranslated;
    }

    // Final fallback
    return `${sanitizedText} [Would be translated to ${
      langNames[targetLang] || targetLang
    }]`;
  };

  /**
   * Enhances common medical terms with clinical terminology
   * @param {string} text - Input text to enhance
   * @returns {string} Text with enhanced medical terminology
   */
  const enhanceMedicalTerms = (text) => {
    // --- SECURITY: Sanitize input ---
    const sanitizedText = sanitizeInput(text);

    let enhancedText = sanitizedText;
    Object.entries(medicalTermsMap).forEach(([common, medical]) => {
      const regex = new RegExp(`\\b${common}\\b`, "gi");
      enhancedText = enhancedText.replace(regex, medical);
    });
    return enhancedText;
  };

  /**
   * Starts speech recognition and sets up event handlers
   * Includes browser compatibility checks and error handling
   */
  const startListening = useCallback(() => {
    // Check if browser supports speech recognition
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      showNotification(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
        "error"
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = inputLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      showNotification("Listening...", "info");
    };

    recognition.onresult = async (event) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }

      // Update the transcript state
      if (finalTranscript) {
        // --- SECURITY: Sanitize transcript before processing ---
        const sanitizedTranscript = sanitizeInput(finalTranscript);
        const enhancedTranscript = enhanceMedicalTerms(sanitizedTranscript);
        setTranscript((prev) => prev + enhancedTranscript);

        // Detect source language from recognition language setting
        const sourceLang = detectInputLanguage(inputLanguage);

        // Translate the final text using MyMemory API
        try {
          const translated = await translateWithMyMemory(
            enhancedTranscript,
            outputLanguage,
            sourceLang
          );
          setTranslatedText((prev) => prev + " " + translated);
        } catch (error) {
          console.error("Translation error:", error);
          showNotification("Translation error occurred", "error");
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      stopListening();

      if (event.error === "not-allowed") {
        showNotification(
          "Microphone access is not allowed. Please enable microphone permissions.",
          "error"
        );
      } else {
        showNotification(`Error: ${event.error}`, "error");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      showNotification("Stopped listening", "info");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      showNotification("Error starting speech recognition", "error");
    }
  }, [inputLanguage, outputLanguage, showNotification]);

  /**
   * Stops the speech recognition process
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  /**
   * Clears all transcript and translation data
   */
  const clearText = useCallback(() => {
    setTranscript("");
    setTranslatedText("");
    showNotification("Text cleared", "info");
  }, [showNotification]);

  /**
   * Uses speech synthesis to speak the translated text
   * Includes browser compatibility check
   */
  const speakTranslation = useCallback(() => {
    if (!translatedText) return;

    if (!("speechSynthesis" in window)) {
      showNotification(
        "Speech synthesis is not supported in this browser.",
        "error"
      );
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = outputLanguage;
    utterance.rate = 0.9; // Slightly slower for clarity

    utterance.onend = () => {
      showNotification("Finished playing translation", "info");
    };

    speechSynthesis.speak(utterance);
    showNotification("Playing translation", "info");
  }, [translatedText, outputLanguage, showNotification]);

  /**
   * Copies translated text to clipboard
   * Includes success/error handling
   */
  const copyTranslation = useCallback(() => {
    if (!translatedText) return;

    navigator.clipboard
      .writeText(translatedText)
      .then(() => {
        showNotification("Translation copied to clipboard", "success");
      })
      .catch((err) => {
        showNotification("Failed to copy text", "error");
        console.error("Failed to copy text: ", err);
      });
  }, [translatedText, showNotification]);

  return {
    isListening,
    transcript,
    translatedText,
    startListening,
    stopListening,
    clearText,
    speakTranslation,
    copyTranslation,
  };
};
