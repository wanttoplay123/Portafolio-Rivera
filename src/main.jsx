import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LangProvider } from './i18n.jsx'
import './styles.css'
import './lang.css'
import './about.css'
import './scrollvideo.css'
import './stage.css'
import './skills.css'
import './mesa.css'
import './saloon.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>
)
