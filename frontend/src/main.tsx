import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { App } from './App'
import { initializeAnalytics } from './analytics'

const container = document.getElementById('root')!
initializeAnalytics()
createRoot(container).render(<App />)
