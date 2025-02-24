import React, { useEffect, useState } from 'react';
import { fetchHelloMessage } from './services/apiServices';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const data = await fetchHelloMessage();
      setMessage(data.message || data.error);
    })();
  }, []);

  return (
    <div className="App">
      <h1>Frontend</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}

export default App;
