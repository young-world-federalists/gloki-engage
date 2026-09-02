import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './styles/index.scss'
import App from './App.tsx'
import { store } from './store'
import { I18nProvider } from './i18n'
 
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </Provider>
  </StrictMode>,
)
