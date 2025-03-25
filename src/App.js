import React from "react";
import { Routes, Route } from "react-router-dom"; // To handle routing
import Home from "./frontend/Home.js";
import Syllabus from "./frontend/Syllabus.js";
import Faculty from "./frontend/Faculty.js";
import SemInfo from "./frontend/semInfo.js";
import Course from "./frontend/Course.js";
import Summary from "./frontend/Summary.js";
import FacultyLogin from "./frontend/FacultyLogin.js";
import CourseDetailsPage from "./frontend/CourseDetailsPage.js";
import Regulations from "./frontend/Regulations.js";
import CourseWord from "./frontend/CourseWord.js";
import ProfessionalMe from "./frontend/ProfessionalMe.js";
import CourseMe from './frontend/CourseMe.js';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} /> {/* Home route */}
        {/* <Route path="/faculty-login" element={<FacultyLogin />} /> */}
        <Route path="/faculty-login" element={<FacultyLogin />} />
        <Route path="/semInfo" element={<SemInfo />} />
        {/* <Route path="/syllabus" element={<Syllabus />} />  */}
        <Route path="/syllabus" element={<Course />} />
        <Route path="/faculty" element={<Faculty />} /> {/* Syllabus route */}
        <Route path="/course-details" element={<CourseDetailsPage />} />
        <Route path="/Summary" element={<Summary />} />
        <Route path="/Regulations" element={<Regulations />} />
        <Route path = "/wordPage" element = {<CourseWord />}/>
        <Route path = "/ProfessionalMe" element = {<ProfessionalMe/>}/>
        <Route path="/courseME" element = {<CourseMe />} />
      </Routes>
    </div>
  );
}

export default App;
