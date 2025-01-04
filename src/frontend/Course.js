import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Course.css";

function Course() {
  const [semData, setSemData] = useState([]);
  const [currentSem, setCurrentSem] = useState(1);
  const [commonInfo, setCommonInfo] = useState({
    semNo: currentSem,
    totalCredits: 0,
    totalCourses: 0,
    caMarks: "",
    feMarks: "",
    totalMarks: "",
    department: "",
  });
  const [courses, setCourses] = useState([]);
  const [totalRow, setTotalRow] = useState({
    lecture: 0,
    tutorial: 0,
    practical: 0,
    credits: 0,
  });

  useEffect(() => {
    // Fetch semester info for the current semester
    const fetchSemInfo = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/seminfo/${currentSem}`);
        console.log(response.data); // Make sure the response data is correct

        const data = response.data;

        // Update commonInfo state with correct values
        setCommonInfo((prev) => ({
          ...prev,
          totalCredits: data.total_credits,
          totalCourses: data.total_courses,
        }));

        // Create courses array based on total_courses from the response
        setCourses(
          Array.from({ length: data.total_courses }, () => ({
            courseCode: "",
            courseTitle: "",
            lecture: 0,
            tutorial: 0,
            practical: 0,
            credits: 0,
            type: "",
            faculty: "",
          }))
        );
      } catch (error) {
        console.error("Error fetching semester info:", error);
      }
    };

    fetchSemInfo();
  }, [currentSem]);

  // Ensure semNo updates when currentSem changes
  useEffect(() => {
    setCommonInfo((prev) => ({ ...prev, semNo: currentSem }));
  }, [currentSem]);

  // Handle input changes for common info
  const handleCommonInfoChange = (e) => {
    const { name, value } = e.target;
    setCommonInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle input changes for course details
  const handleCourseChange = (index, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[index][field] = value;

    // Update total row
    const totals = updatedCourses.reduce(
      (acc, course) => ({
        lecture: acc.lecture + Number(course.lecture || 0),
        tutorial: acc.tutorial + Number(course.tutorial || 0),
        practical: acc.practical + Number(course.practical || 0),
        credits: acc.credits + Number(course.credits || 0),
      }),
      { lecture: 0, tutorial: 0, practical: 0, credits: 0 }
    );

    setCourses(updatedCourses);
    setTotalRow(totals);
  };

  // Submit data for the current semester
  const handleSubmit = async () => {
    if (totalRow.credits !== commonInfo.totalCredits) {
      alert("Total credits do not match the expected value!");
      return;
    }

    const semesterData = courses.map((course) => ({
      sem_no: currentSem,
      course_code: course.courseCode,
      course_name: course.courseTitle,
      lecture: course.lecture,
      tutorial: course.tutorial,
      practical: course.practical,
      credits: course.credits,
      ca_marks: commonInfo.caMarks,
      fe_marks: commonInfo.feMarks,
      total_marks: commonInfo.totalMarks,
      type: course.type,
      faculty: course.faculty,
      department: commonInfo.department,
    }));

    try {
      await axios.post("http://localhost:4000/api/courses", semesterData);
      alert("Data submitted successfully!");
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Failed to submit data.");
    }
  };

  // Navigate to the next semester
  const handleNext = () => {
    if (currentSem < 8) {
      setCurrentSem((prev) => prev + 1);
    }
  };

  // Navigate to the previous semester
  const handleBack = () => {
    if (currentSem > 1) {
      setCurrentSem((prev) => prev - 1);
    }
  };

  return (
    <div className="container-course">
      <h1>Course Details - Semester {currentSem}</h1>

      {/* Common Information Section */}
      <div className="form-container">
        <h3>Common Information</h3>
        <div className="form-fields">
          <div>
            <label>Semester Number:</label>
            <input type="number" value={commonInfo.semNo} readOnly />
          </div>
          <div>
            <label>Total Credits:</label>
            <input type="number" value={commonInfo.totalCredits} readOnly />
          </div>
          <div>
            <label>Total Courses:</label>
            <input type="number" value={commonInfo.totalCourses} readOnly />
          </div>
          <div>
            <label>CA Marks:</label>
            <input
              type="number"
              name="caMarks"
              value={commonInfo.caMarks}
              onChange={handleCommonInfoChange}
            />
          </div>
          <div>
            <label>FE Marks:</label>
            <input
              type="number"
              name="feMarks"
              value={commonInfo.feMarks}
              onChange={handleCommonInfoChange}
            />
          </div>
          <div>
            <label>Total Marks:</label>
            <input
              type="number"
              name="totalMarks"
              value={commonInfo.totalMarks}
              onChange={handleCommonInfoChange}
            />
          </div>
          <div>
            <label>Department:</label>
            <input
              type="text"
              name="department"
              value={commonInfo.department}
              onChange={handleCommonInfoChange}
            />
          </div>
        </div>
      </div>

      {/* Course Details Section */}
      <div className="table-container">
        <h3>Course Details</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Lecture</th>
              <th>Tutorial</th>
              <th>Practical</th>
              <th>Credits</th>
              <th>Type</th>
              <th>Faculty Assigned</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => (
              <tr key={index}>
                {Object.keys(course).map((field) => (
                  <td key={field}>
                    <input
                      type={
                        field === "lecture" ||
                        field === "tutorial" ||
                        field === "practical" ||
                        field === "credits"
                          ? "number"
                          : "text"
                      }
                      value={course[field]}
                      onChange={(e) =>
                        handleCourseChange(index, field, e.target.value)
                      }
                      className={field === "courseTitle" ? "course-title-input" : ""}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td colSpan="2">Total</td>
              <td>{totalRow.lecture}</td>
              <td>{totalRow.tutorial}</td>
              <td>{totalRow.practical}</td>
              <td>{totalRow.credits}</td>
              <td colSpan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={handleNext} disabled={currentSem >= 8}>
          Next Semester
        </button>
        <button onClick={handleBack} disabled={currentSem <= 1}>
          Back to Previous Semester
        </button>
      </div>
    </div>
  );
}

export default Course;
