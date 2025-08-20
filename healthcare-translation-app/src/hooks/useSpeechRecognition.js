import { useState, useRef, useCallback } from "react";

// Medical terms mapping for enhancement
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

// Language code mapping for MyMemory API
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

// MyMemory API language pairs (supported combinations)
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

export const useSpeechRecognition = (
  inputLanguage,
  outputLanguage,
  showNotification
) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const recognitionRef = useRef(null);

  // Function to detect input language from speech recognition language code
  const detectInputLanguage = (recognitionLang) => {
    const baseLang = recognitionLang.split("-")[0];
    return languageCodeMap[baseLang] || "en";
  };

  // Check if language pair is supported by MyMemory
  const isLanguagePairSupported = (sourceLang, targetLang) => {
    return supportedLanguagePairs[sourceLang]?.includes(targetLang) || false;
  };

  // MyMemory Translation API integration
  const translateWithMyMemory = async (text, targetLang, sourceLang) => {
    // Don't translate if source and target languages are the same
    if (sourceLang === targetLang) {
      return text;
    }

    // Check if language pair is supported
    if (!isLanguagePairSupported(sourceLang, targetLang)) {
      showNotification(
        `Translation from ${sourceLang} to ${targetLang} not supported. Using fallback.`,
        "warning"
      );
      return handleFallbackTranslation(text, targetLang);
    }

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
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
        return data.responseData.translatedText;
      } else {
        throw new Error(`Translation failed: ${data.responseStatus}`);
      }
    } catch (error) {
      console.error("Translation error:", error);
      showNotification(
        "Translation service unavailable. Using fallback.",
        "warning"
      );
      return handleFallbackTranslation(text, targetLang);
    }
  };

  // Client-side fallback translation for common medical phrases
  const clientSideFallback = (text, targetLang) => {
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

    const words = text.toLowerCase().split(/\s+/);
    const translatedWords = words.map((word) => {
      const cleanWord = word.replace(/[.,!?;:]/g, "");
      return commonTranslations[targetLang]?.[cleanWord] || word;
    });

    return translatedWords.join(" ");
  };

  // Handle fallback translation
  const handleFallbackTranslation = (text, targetLang) => {
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
    const clientTranslated = clientSideFallback(text, targetLang);
    if (clientTranslated !== text.toLowerCase()) {
      return clientTranslated;
    }

    // Final fallback
    return `${text} [Would be translated to ${
      langNames[targetLang] || targetLang
    }]`;
  };

  // Enhance medical terms in the text
  const enhanceMedicalTerms = (text) => {
    let enhancedText = text;
    Object.entries(medicalTermsMap).forEach(([common, medical]) => {
      const regex = new RegExp(`\\b${common}\\b`, "gi");
      enhancedText = enhancedText.replace(regex, medical);
    });
    return enhancedText;
  };

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
        const enhancedTranscript = enhanceMedicalTerms(finalTranscript);
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

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const clearText = useCallback(() => {
    setTranscript("");
    setTranslatedText("");
    showNotification("Text cleared", "info");
  }, [showNotification]);

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