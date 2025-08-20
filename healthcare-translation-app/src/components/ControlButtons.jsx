import React from "react";

const ControlButtons = ({
  isListening,
  onStartListening,
  onStopListening,
  onClearText,
}) => {
  return (
    <div className="controls">
      <button className="btn" onClick={onStartListening} disabled={isListening}>
        {isListening && <span className="spinner"></span>}
        Start Listening
      </button>
      <button
        className="btn btn-danger"
        onClick={onStopListening}
        disabled={!isListening}
      >
        Stop Listening
      </button>
      <button className="btn btn-secondary" onClick={onClearText}>
        Clear Text
      </button>
    </div>
  );
};

export default ControlButtons;
