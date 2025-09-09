import React from "react";

/**
 * ControlButtons component provides the main interaction controls for
 * speech recognition functionality including start, stop, and clear operations.
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.isListening - Indicates if speech recognition is active
 * @param {function} props.onStartListening - Callback to initiate speech recognition
 * @param {function} props.onStopListening - Callback to stop speech recognition
 * @param {function} props.onClearText - Callback to clear all transcript text
 */
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
