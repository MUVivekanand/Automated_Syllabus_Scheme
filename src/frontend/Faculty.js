import React, { useState } from "react";
import axios from "axios";

function Faculty() {
  const [facultyName, setFacultyName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // To handle errors

  const getCourse = async () => {
    try {
      const response = await axios.get("http://localhost:4000/getCourse", {
        params: {
          facultyName: facultyName.trim(),
        },
      });

      setCourseTitle(response.data.courseTitle);
      setErrorMessage(""); // Reset error message if successful
    } catch (error) {
      console.error("Error fetching course data:", error);
      setCourseTitle(""); // Reset course title if error occurs
      if (error.response) {
        setErrorMessage(error.response.data.message); // Display error message from backend
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    }
  };

  return (
    <div>
      <h1>Faculty Login</h1>
      <div>
        <label htmlFor="faculty-name">Enter Faculty Name: </label>
        <input
          type="text"
          id="faculty-name"
          value={facultyName}
          onChange={(e) => setFacultyName(e.target.value)}
        />
      </div>
      <button onClick={getCourse} className="facultycourse">
        Get Assigned Course
      </button>

      <div>
        {courseTitle && <p>Assigned Course: {courseTitle}</p>}
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      </div>
    </div>
  );
}

export default Faculty;

