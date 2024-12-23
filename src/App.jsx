import React, { Suspense, lazy } from 'react';
import './App.css';

// Dynamically import SpeechRecognition and disable SSR


const Home = lazy(() => import('./Home'));

function App() {
  return (
    <div className="App">
      <Suspense fallback={<div>Loading...</div>}>
        <Home />
      </Suspense>
    </div>
  );
}

export default App;
