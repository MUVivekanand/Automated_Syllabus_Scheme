import React from "react";
import ReactDOM from "react-dom/client";  // Updated import
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Create a root using React 18's createRoot method
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter> 
    <App />
  </BrowserRouter>
);


