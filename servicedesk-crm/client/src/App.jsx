import { useState } from 'react';
import './index.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-500 flex flex-col items-center justify-center">
      <div className="bg-blue-500 text-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Tailwind v4 is working!</h1>
        <p className="mb-6">Click the button below to test state updates:</p>
        <button
          className="bg-white text-blue-900 font-semibold py-2 px-4 rounded hover:bg-gray-200 transition"
          onClick={() => setCount(count + 1)}
        >
          Click Me
        </button>
        <p className="mt-4 text-lg font-medium">Count: {count}</p>
      </div>
    </div>
  );
}

export default App;
