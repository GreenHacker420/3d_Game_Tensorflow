import React from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import antdTheme from './config/antdTheme'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: antdTheme.token,
        components: antdTheme.components,
      }}
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ConfigProvider>
  </React.StrictMode>
)
