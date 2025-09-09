import React from 'react'

/**
 * Header component displaying the application branding and logo.
 * Provides consistent navigation identity across all application views.
 */
const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <i>⚕️</i> MediTranslate
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header