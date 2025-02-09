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
    textbooks: [],
    references: [],
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

  const getCourseDetails = async () => {
    if (!selectedCourse) {
      alert("Please select a course first.");
      return;
    }

    const [courseCode] = selectedCourse.split(" - ");
    try {
      const response = await axios.get(
        "http://localhost:4000/getCourseDetails",
        {
          params: { courseCode },
        }
      );

      if (response.data.success) {
        setCourseDetails(response.data.courseDetails);
      } else {
        alert("Failed to fetch course details.");
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      alert("Unexpected error while fetching course details.");
    }
  };

  // Handle dropdown change
  const handleCourseSelection = (event) => {
    setSelectedCourse(event.target.value);
    setCourseDetails({
      co: Array(5).fill({ name: "", desc: "" }),
      textbooks: [],
      references: [],
    });
  };

  // Handles input changes dynamically
  const handleChange = (field, index, key, value) => {
    setCourseDetails((prevDetails) => ({
      ...prevDetails,
      [field]: prevDetails[field].map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!selectedCourse) {
      alert("Please select a course first.");
      return;
    }

    const [courseCode, courseName] = selectedCourse.split(" - ");

    try {
      const response = await axios.post(
        "http://localhost:4000/updateCourseDetails",
        {
          courseCode,
          facultyName,
          coDetails: courseDetails.co,
          textbooks: courseDetails.textbooks,
          references: courseDetails.references, // Change this from 'refs' to 'references'
        }
      );

      if (response.data.success) {
        alert("Course details updated successfully!");
        navigate("/course-details", {
          state: {
            courseName: `${courseCode} - ${courseName}`,
            courseDetails: {
              ...courseDetails,
              lecture:
                courses.find((c) => c.course_code === courseCode)?.lecture || 0,
              tutorial:
                courses.find((c) => c.course_code === courseCode)?.tutorial ||
                0,
              practical:
                courses.find((c) => c.course_code === courseCode)?.practical ||
                0,
              credits:
                courses.find((c) => c.course_code === courseCode)?.credits || 0,
            },
          },
        });
      } else {
        alert(`Failed to update course details: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Error updating course details:", error);
      alert(
        `Unexpected error: ${error.response?.data?.error || error.message}`
      );
    }
  };

  return (
    <div className="faculty-container">
      <h1 className="faculty-title">Faculty Dashboard</h1>
      <h2 className="faculty-welcome">Welcome, {facultyName}</h2>

      {/* Assigned Courses Table */}
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

      {/* Select Course Dropdown */}
      <div className="course-dropdown-container">
        <label className="dropdown-label">Select Course:</label>
        <select
          className="course-dropdown"
          value={selectedCourse}
          onChange={handleCourseSelection}
        >
          <option value="">-- Select a Course --</option>
          {courses.map((course) => (
            <option
              key={course.course_code}
              value={`${course.course_code} - ${course.course_name}`}
            >
              {course.course_code} - {course.course_name}
            </option>
          ))}
        </select>
        <button className="view-button" onClick={getCourseDetails}>
          View Course Details
        </button>
      </div>

      {/* Course Details Box */}
      {selectedCourse && (
        <div className="course-details-box">
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
                    handleChange("co", i, "name", e.target.value)
                  }
                />
                <textarea
                  className="input-field textarea-field"
                  placeholder={`CO${i + 1} Description`}
                  value={co.desc}
                  onChange={(e) =>
                    handleChange("co", i, "desc", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          {/* Textbooks Section */}
          <h4 className="section-title">Textbooks</h4>
          <div className="textbook-section">
            {courseDetails.textbooks.map((textbook, i) => (
              <div key={i} className="textbook-entry">
                {[
                  "title",
                  "author",
                  "edition",
                  "publisher",
                  "place",
                  "year",
                ].map((field) => (
                  <input
                    key={field}
                    className="input-field"
                    type="text"
                    placeholder={`Textbook ${i + 1} ${field}`}
                    value={textbook[field] || ""}
                    onChange={(e) =>
                      handleChange("textbooks", i, field, e.target.value)
                    }
                  />
                ))}
              </div>
            ))}
            <button
              className="add-button"
              onClick={() =>
                setCourseDetails((prev) => ({
                  ...prev,
                  textbooks: [
                    ...prev.textbooks,
                    {
                      title: "",
                      author: "",
                      edition: "",
                      publisher: "",
                      place: "",
                      year: "",
                    },
                  ],
                }))
              }
              disabled={courseDetails.textbooks.length >= 2} // Disable when 2 textbooks added
            >
              + Add Textbook
            </button>
          </div>

          {/* References Section */}
          <h4 className="section-title">References</h4>
          <div className="reference-section">
            {courseDetails.references.map((reference, i) => (
              <div key={i} className="reference-entry">
                {[
                  "title",
                  "author",
                  "edition",
                  "publisher",
                  "place",
                  "year",
                ].map((field) => (
                  <input
                    key={field}
                    className="input-field"
                    type="text"
                    placeholder={`Reference ${i + 1} ${field}`}
                    value={reference[field] || ""}
                    onChange={(e) =>
                      handleChange("references", i, field, e.target.value)
                    }
                  />
                ))}
              </div>
            ))}
            <button
              className="add-button"
              onClick={() =>
                setCourseDetails((prev) => ({
                  ...prev,
                  references: [
                    ...prev.references,
                    {
                      title: "",
                      author: "",
                      edition: "",
                      publisher: "",
                      place: "",
                      year: "",
                    },
                  ],
                }))
              }
              disabled={courseDetails.references.length >= 4} // Disable when 4 references added
            >
              + Add Reference
            </button>
          </div>

          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export default Faculty;
