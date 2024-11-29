import { StrictMode } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
// import { Provider } from 'react-redux'
// import store from './redux/store'

/**
 * @param {string} url
 * @param {string} [ssrManifest]
 * @param {import('react-dom/server').RenderToPipeableStreamOptions} [options]
 */
export function render(url, ssrManifest, options) {

  return renderToPipeableStream(
    <StaticRouter
      location={url}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
          <App />
    </StaticRouter>,
    options,
  )
}
