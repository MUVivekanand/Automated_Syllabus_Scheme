import React from "react";
import { Routes, Route } from "react-router-dom";  // To handle routing
import Home from "./frontend/Home.js";
import Syllabus from "./frontend/Syllabus.js";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Home route */}
        <Route path="/syllabus" element={<Syllabus />} />  {/* Syllabus route */}
      </Routes>
    </div>
  );
}

export default App;
