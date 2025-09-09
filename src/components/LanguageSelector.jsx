import React from "react";

/**
 * LanguageSelector component provides dropdown interfaces for selecting
 * input (speech recognition) and output (translation) languages.
 *
 * @param {Object} props - Component properties
 * @param {string} props.inputLanguage - Currently selected input language code
 * @param {string} props.outputLanguage - Currently selected output language code
 * @param {function} props.onInputLanguageChange - Callback for input language selection changes
 * @param {function} props.onOutputLanguageChange - Callback for output language selection changes
 */
const LanguageSelector = ({
  inputLanguage,
  outputLanguage,
  onInputLanguageChange,
  onOutputLanguageChange,
}) => {
  return (
    <div className="language-selectors">
      <div className="form-group">
        <label htmlFor="inputLanguage">Input Language</label>
        <select
          id="inputLanguage"
          value={inputLanguage}
          onChange={(e) => onInputLanguageChange(e.target.value)}
        >
          <option value="en-US">English (US)</option>
          <option value="es-ES">Spanish (Spain)</option>
          <option value="fr-FR">French (France)</option>
          <option value="de-DE">German (Germany)</option>
          <option value="it-IT">Italian (Italy)</option>
          <option value="pt-BR">Portuguese (Brazil)</option>
          <option value="ru-RU">Russian (Russia)</option>
          <option value="zh-CN">Chinese (China)</option>
          <option value="ja-JP">Japanese (Japan)</option>
          <option value="ar-SA">Arabic (Saudi Arabia)</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="outputLanguage">Output Language</label>
        <select
          id="outputLanguage"
          value={outputLanguage}
          onChange={(e) => onOutputLanguageChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ru">Russian</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ar">Arabic</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
