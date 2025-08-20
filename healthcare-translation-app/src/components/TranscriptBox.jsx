import React from "react";

const TranscriptBox = ({
  title,
  content,
  status,
  isListening = false,
  showActions = false,
  onSpeak,
  onCopy,
  isTranslated = false,
}) => {
  return (
    <div className="transcript-box">
      <div className="transcript-header">
        <span className="transcript-title">{title}</span>
        {status && (
          <span>
            <span
              className={`status-indicator ${
                isListening ? "status-listening" : "status-inactive"
              }`}
            ></span>
            {status}
          </span>
        )}
      </div>
      <div className="transcript-content">
        {isTranslated ? content : enhanceMedicalTerms(content)}
      </div>
      {showActions && (
        <div className="action-buttons">
          <button className="btn action-btn" onClick={onSpeak}>
            Speak
          </button>
          <button className="btn btn-secondary action-btn" onClick={onCopy}>
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to enhance medical terms with highlighting
function enhanceMedicalTerms(text) {
  if (!text) return text;

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

  let enhancedText = text;

  // Replace common terms with medical terminology
  Object.keys(medicalTermsMap).forEach((commonTerm) => {
    const regex = new RegExp(`\\b${commonTerm}\\b`, "gi");
    enhancedText = enhancedText.replace(
      regex,
      `<span class="highlight" title="Medical term: ${medicalTermsMap[commonTerm]}">${commonTerm}</span>`
    );
  });

  return <div dangerouslySetInnerHTML={{ __html: enhancedText }} />;
}

export default TranscriptBox;
