import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import App from './App'
// import store from './redux/store';
// import { Provider } from 'react-redux'

hydrateRoot(
  document.getElementById('root'),
  <BrowserRouter
    future={{
      v7_relativeSplatPath: true,
      v7_startTransition: true,
    }}
  >
          <App />
  </BrowserRouter>,
)
