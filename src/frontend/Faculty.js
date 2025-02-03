import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Faculty.css";

function Faculty() {
  const [facultyName, setFacultyName] = useState(
    localStorage.getItem("facultyName") || ""
  );
  const [courses, setCourses] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(""); // Selected course code
  const [courseDetails, setCourseDetails] = useState({
    co: Array(5).fill({ name: "", desc: "" }),
    textbooks: Array(4).fill(""),
    references: Array(4).fill(""),
  });

  useEffect(() => {
    if (facultyName) {
      getCourses();
    }
  }, [facultyName]);

  const getCourses = async () => {
    try {
      const response = await axios.get("http://localhost:4000/getCourse", {
        params: { facultyName },
      });

      if (response.data.success) {
        setCourses(response.data.courses);
        setErrorMessage("");
      } else {
        setCourses([]);
        setErrorMessage("No courses assigned to this faculty.");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
      setErrorMessage(
        error.response?.data?.message || "An unexpected error occurred."
      );
    }
  };

  // Handle dropdown change
  const handleCourseSelection = (event) => {
    setSelectedCourse(event.target.value);
    setCourseDetails({
      co: Array(5).fill({ name: "", desc: "" }),
      textbooks: Array(4).fill(""),
      references: Array(4).fill(""),
    });
  };

  // Handles input changes dynamically
  const handleChange = (field, index, value) => {
    setCourseDetails((prevDetails) => ({
      ...prevDetails,
      [field]: prevDetails[field].map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!selectedCourse) {
      alert("Please select a course first.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/updateCourseDetails",
        {
          courseCode: selectedCourse,
          facultyName,
          coDetails: courseDetails.co,
          textbooks: courseDetails.textbooks,
          references: courseDetails.references,
        }
      );

      if (response.data.success) {
        alert("Course details updated successfully!");
        navigate("/course-details", {
          state: {
            courseName: courses.find((c) => c.course_code === selectedCourse)
              ?.course_name,
            courseDetails,
          },
        });
      } else {
        alert("Failed to update course details.");
      }
    } catch (error) {
      console.error("Error updating course details:", error);
      alert("An unexpected error occurred.");
    }
  };
  return (
    <div className="faculty-container">
      <h1 className="faculty-title">Faculty Dashboard</h1>
      <h2 className="faculty-welcome">Welcome, {facultyName}</h2>

      {/* Table: Assigned Courses */}
      <div className="course-section">
        <h3>Assigned Courses</h3>
        {courses.length > 0 ? (
          <table className="course-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Lecture</th>
                <th>Tutorial</th>
                <th>Practical</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={index}>
                  <td>{course.course_code}</td>
                  <td>{course.course_name}</td>
                  <td>{course.lecture}</td>
                  <td>{course.tutorial}</td>
                  <td>{course.practical}</td>
                  <td>{course.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="error-message">{errorMessage}</p>
        )}
      </div>

      {/* Section: Select Course & Add Details */}
      <div className="course-details-container">
        <h3>Select Course & Add Details</h3>
        <label className="dropdown-label">Select Course:</label>
        <select
          className="course-dropdown"
          value={selectedCourse}
          onChange={handleCourseSelection}
        >
          <option value="">-- Select a Course --</option>
          {courses.map((course) => (
            <option key={course.course_code} value={course.course_code}>
              {course.course_name} ({course.course_code})
            </option>
          ))}
        </select>

        {/* Course Details Form */}
        {selectedCourse && (
          <div>
            <h4 className="section-title">Course Outcomes (COs)</h4>
            <div className="co-section">
              {courseDetails.co.map((co, i) => (
                <div key={i} className="co-entry">
                  <input
                    className="input-field"
                    type="text"
                    placeholder={`CO${i + 1} Name`}
                    value={co.name}
                    onChange={(e) =>
                      handleChange("co", i, { ...co, name: e.target.value })
                    }
                  />
                  <input
                    className="input-field"
                    type="text"
                    placeholder={`CO${i + 1} Description`}
                    value={co.desc}
                    onChange={(e) =>
                      handleChange("co", i, { ...co, desc: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

            <h4 className="section-title">Textbooks</h4>
            <div className="textbook-section">
              {courseDetails.textbooks.map((textbook, i) => (
                <input
                  key={i}
                  className="input-field"
                  type="text"
                  placeholder={`Textbook ${i + 1}`}
                  value={textbook}
                  onChange={(e) => handleChange("textbooks", i, e.target.value)}
                />
              ))}
            </div>

            <h4 className="section-title">References</h4>
            <div className="reference-section">
              {courseDetails.references.map((reference, i) => (
                <input
                  key={i}
                  className="input-field"
                  type="text"
                  placeholder={`Reference ${i + 1}`}
                  value={reference}
                  onChange={(e) =>
                    handleChange("references", i, e.target.value)
                  }
                />
              ))}
            </div>

            <br />
            <button className="save-button" onClick={handleSave}>
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Faculty;
