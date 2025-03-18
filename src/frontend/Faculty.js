import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Faculty.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function Faculty() {
  const [facultyName, setFacultyName] = useState(
    localStorage.getItem("facultyName") || ""
  );
  const [courses, setCourses] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(""); // Selected course code
  const [courseDetails, setCourseDetails] = useState({
    co: Array(5).fill({ name: "", desc: "" }),
    hours: Array(5).fill({ hour1: "", hour2: "" }),
    textbooks: [],
    references: [],
    outcomes: Array(5).fill(""),
  });
  const [expandedSections, setExpandedSections] = useState({
    syllabus: false,
    textbooks: false,
    references: false,
    courseOutcomes: false,
    table: false
  });

  // Function to toggle individual sections
  const toggleExpand = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section], // Toggle only the clicked section
    }));
  };

  useEffect(() => {
    if (facultyName) {
      getCourses();
    }
  }, [facultyName]);

  const getCourses = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/faculty/getCourse",
        {
          params: { facultyName },
        }
      );

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

    const [, courseName] = selectedCourse.split(" - "); // ✅ Extract courseName
    try {
      const response = await axios.get(
        "http://localhost:4000/api/faculty/getCourseDetails",
        {
          params: { courseName }, // ✅ Send courseName instead of courseCode
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
      hours: Array(5).fill({ hour1: "", hour2: "" }),
      textbooks: [],
      references: [],
      outcomes: Array(5).fill(""),
    });
  };

  // Handles input changes dynamically
  const handleChange = (field, index, key, value) => {
    setCourseDetails((prevDetails) => ({
      ...prevDetails,
      [field]: prevDetails[field].map((item, i) =>
        i === index
          ? Array.isArray(prevDetails[field]) && typeof item === "object"
            ? { ...item, [key]: value } // Case 1: If item is an object, update its property
            : value // Case 2: If item is a primitive, replace it directly
          : item
      ),
    }));
  };

  const generateExcel = () => {
    if (!selectedCourse) {
      alert("Please select a course first.");
      return;
    }
  
    const [courseCode, courseName] = selectedCourse.split(" - "); // Extract Course Code & Name
  
    // Headers Row
    const headers = [
      "Course Code",
      "Course Name",
      "COs/POs",
      "POa",
      "POb",
      "POc",
      "POd",
      "POe",
      "POf",
      "POg",
      "POh",
      "POi",
      "POj",
      "POk",
      "PSO1",
      "PSO2",
    ];
  
    // Generate rows for each CO with '\n' for wrapping
    const dataRows = courseDetails.outcomes.map((outcome, index) => {
      return [
        index === 0 ? courseCode : "", // Course Code in first CO row only
        index === 0 ? courseName : "", // Course Name in first CO row only
        `CO${index+1}:\n${outcome || "N/A"}`, // CO description with '\n' to force wrap
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "", // Empty PO values
      ];
    });
  
    // Create the worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  
    // Set column widths (Increased for Course Name and COs/POs)
    ws["!cols"] = [
      { wch: 15 }, // Course Code
      { wch: 40 }, // Course Name (Increased width)
      { wch: 60 }, // COs/POs (Increased width to accommodate wrapping)
      ...Array(13).fill({ wch: 10 }), // Default width for PO mappings
    ];
  
    // Set cell styles manually (Enable wrap text in Excel)
    Object.keys(ws).forEach((cell) => {
      if (cell.startsWith("C")) { // COs/POs Column (Column C)
        ws[cell].s = { alignment: { wrapText: true } }; // Wrap text
      }
    });
  
    // Create a workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PO Mapping");
  
    // Convert to Blob and trigger download
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  
    saveAs(dataBlob, `PO_Mapping_${courseCode}.xlsx`);
  };

  const navigate = useNavigate();

  const handleSave = async () => {
    if (!selectedCourse) {
      alert("Please select a course first.");
      return;
    }

    const [courseCode, courseName] = selectedCourse.split(" - ");

    const selectedCourseDetails = courses.find(
      (course) => course.course_code === courseCode
    );

    if (!selectedCourseDetails) {
      alert("Course not found.");
      return;
    }

    const { credits } = selectedCourseDetails;
    const totalHours = courseDetails.hours.reduce(
      (total, hour) =>
        total + (parseInt(hour.hour1) || 0) + (parseInt(hour.hour2) || 0),
      0
    );

    const requiredHours = credits === 4 ? 60 : credits === 3 ? 45 : 0;

    if (totalHours !== requiredHours) {
      alert(
        `Total hours must be ${requiredHours} for a course with ${credits} credits.`
      );
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/faculty/updateCourseDetails",
        {
          courseName, // ✅ Send courseName instead of courseCode
          facultyName,
          coDetails: courseDetails.co,
          hours: courseDetails.hours,
          textbooks: courseDetails.textbooks,
          references: courseDetails.references,
          outcomes: courseDetails.outcomes,
        }
      );

      if (response.data.success) {
        alert("Course details updated successfully!");
        navigate("/course-details", {
          state: {
            courseName: `${courseCode} - ${courseName}`,
            courseDetails: {
              ...courseDetails,
              lecture: selectedCourseDetails.lecture || 0,
              tutorial: selectedCourseDetails.tutorial || 0,
              practical: selectedCourseDetails.practical || 0,
              credits: selectedCourseDetails.credits || 0,
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
          <h2 className="course-details-title">Course Details</h2>

          {/* Course Outcome Section */}
          <button className="toggle-btn" onClick={() => toggleExpand("courseOutcomes")}>Course Outcomes</button>
          {expandedSections.courseOutcomes && (
            <div className="course-outcome-section">
              <h4 className="section-title">Course Outcomes</h4>
              {(courseDetails.outcomes).map((outcome, i) => (
                <div key={i} className="unit-outcome">
                  <h5 className="unit-title">Course Outcome {i + 1}</h5>
                  
                  <input
                    className="input-field"
                    type="text"
                    placeholder={`Outcome ${i + 1}`}
                    value={outcome || ""}
                    onChange={(e) =>
                      handleChange("outcomes", i, null, e.target.value)
                    }
                  />
                  
                </div>
              ))}
            </div>
          )}

          {/* Course Syllabus Section */}
          <button className="toggle-btn" onClick={() => toggleExpand("syllabus")}>Course Syllabus</button>
          {expandedSections.syllabus && (
            <div className="co-section content">
              <h4 className="section-title">Course Syllabus</h4>
              {courseDetails.co.map((co, i) => (
                <div key={i} className="co-entry">
                  <input
                    className="input-field"
                    type="text"
                    placeholder={`Unit${i + 1} Name`}
                    value={co.name}
                    onChange={(e) =>
                      handleChange("co", i, "name", e.target.value)
                    }
                  />
                  <textarea
                    className="input-field textarea-field"
                    placeholder={`Unit${i + 1} Description`}
                    value={co.desc}
                    onChange={(e) =>
                      handleChange("co", i, "desc", e.target.value)
                    }
                  />
                  <input
                    className="input-field"
                    type="number"
                    placeholder={`Lecture Hour for Unit${i + 1}`}
                    value={courseDetails.hours[i].hour1}
                    onChange={(e) =>
                      handleChange("hours", i, "hour1", e.target.value)
                    }
                  />
                  <input
                    className="input-field"
                    type="number"
                    placeholder={`Pratical Hour for Unit${i + 1}`}
                    value={courseDetails.hours[i].hour2}
                    onChange={(e) =>
                      handleChange("hours", i, "hour2", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Textbooks Section */}
          <button
            className="toggle-btn"
            onClick={() => toggleExpand("textbooks")}
          >
            Textbooks
          </button>
          {expandedSections.textbooks && (
            <div className="textbook-section">
              <h4 className="section-title">Textbooks</h4>
              {courseDetails.textbooks.map((textbook, i) => (
                <div key={i} className="textbook-entry">
                  {[
                    "title",
                    "author",
                    "publisher",
                    "place",
                    "year",
                  ].map((field) => (
                    <input
                      key={field}
                      className="input-field"
                      type="text"
                      placeholder={`Textbook ${i + 1} ${field === "author" ? "authors" : field}`}
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
          )}

          {/* References Section */}
          <button
            className="toggle-btn"
            onClick={() => toggleExpand("references")}
          >
            References
          </button>
          {expandedSections.references && (
            <div className="reference-section">
              <h4 className="section-title">References</h4>
              {courseDetails.references.map((reference, i) => (
                <div key={i} className="reference-entry">
                  {[
                    "title",
                    "author",
                    "publisher",
                    "place",
                    "year",
                  ].map((field) => (
                    <input
                      key={field}
                      className="input-field"
                      type="text"
                      placeholder={`Reference ${i + 1} ${field === "author" ? "authors" : field}`}
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
          )}

          


          <button className="save-button" onClick={handleSave}>
            Save
          </button><br/><br/>

          {/* Table Section */}
          <button
            className="generate-button"
            onClick={() => toggleExpand("table")}
          >
            {expandedSections.table ? "Hide Table" : "View Table"}
          </button>
          {expandedSections.table && (
            <div className="table-section">
              <h4 className="section-title">Table</h4>
              <div>
                <table border="/">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>COs/POs</th>
                      <th>POa</th>
                      <th>POb</th>
                      <th>POc</th>
                      <th>POd</th>
                      <th>POe</th>
                      <th>POf</th>
                      <th>POg</th>
                      <th>POh</th>
                      <th>POi</th>
                      <th>POj</th>
                      <th>POk</th>
                      <th>PSO1</th>
                      <th>PSO2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>23Z101</td>
                      <td>Calculas and its Applications</td>
                      <td>CO1:N/A</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td>CO2:N/A</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td>CO3:N/A</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td>CO4:N/A</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td>CO5:N/A</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button className="generate-button" onClick={generateExcel}>
            Generate File
          </button>
        </div>
      )}
    </div>
  );
}

export default Faculty;
