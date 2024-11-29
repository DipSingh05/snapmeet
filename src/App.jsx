import './App.css'
import { Suspense, lazy } from 'react'
import reactLogo from './assets/react.svg'

// Works also with SSR as expected
const Home = lazy(() => import('./Home'))

function App() {
  return (
    <>
      <Home />
    </>
  )
}

export default App
