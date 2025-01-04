import React from "react";
import { Routes, Route } from "react-router-dom";  // To handle routing
import Home from "./frontend/Home.js";
import Syllabus from "./frontend/Syllabus.js";
import Faculty from "./frontend/Faculty.js";
import SemInfo from "./frontend/semInfo.js";
import Course from "./frontend/Course.js";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Home route */}
        <Route path = "/semInfo" element = {<SemInfo />} />
        {/* <Route path="/syllabus" element={<Syllabus />} />  */}
        <Route path="/syllabus" element={<Course />} /> 
        <Route path="/faculty" element={<Faculty />} /> {/* Syllabus route */}
      </Routes>
    </div>
  );
}

export default App;
