import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Assuming your main component is in App.js

console.log("React app starting...");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
    <App />
</React.StrictMode>
);

// You can also use the script tag to include your app.js in your HTML file:
// <script src="./src/index.js"></script>


// To test your React app, you can use Jest and React Testing Library.
// For more information, visit https://testing-library.com/docs/react-testing-library/intro

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals


