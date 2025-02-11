import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Course.css";

const Regulations = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regulationYear, setRegulationYear] = useState("");
  const [fromCourseCode, setFromCourseCode] = useState("");
  const [toSemester, setToSemester] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/regulations/allcourses");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegulationChange = (e) => {
    let year = e.target.value.trim();
    if (year.length >= 2) {
      year = year.slice(-2); // Get last two characters
    }
    setRegulationYear(year);
  };

  const handleChange = (courseCode, field, value) => {
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.course_code === courseCode
          ? { ...course, [field]: value }
          : course
      )
    );
  };
  
  const handleSubmit = async (courseCode) => {
    const updatedCourse = courses.find((course) => course.course_code === courseCode);
    if (!updatedCourse) {
      alert("Course not found!");
      return;
    }
  
    try {
      await axios.put(`http://localhost:4000/api/regulations/updatecourse/${courseCode}`, updatedCourse);
      alert("Course updated successfully!");
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Failed to update course");
    }
  };

  const handleMoveCourse = async () => {
    const courseToMove = courses.find((course) => course.course_code === fromCourseCode);
  
    if (!courseToMove) {
      alert("Invalid Course Code. Please enter a valid one.");
      return;
    }
  
    if (!toSemester || isNaN(toSemester) || toSemester < 1 || toSemester > 8) {
      alert("Invalid Semester No. Please enter a valid semester (1-8).");
      return;
    }
  
    console.log(`Moving course with code: ${fromCourseCode}`);
    console.log(`Moving to semester number: ${toSemester}`);
  
    try {
      await axios.delete(`http://localhost:4000/api/regulations/deletecourse/${fromCourseCode}`);
      console.log(`Deleted course with code: ${fromCourseCode}`);
  
      const updatedCourse = { ...courseToMove, sem_no: parseInt(toSemester, 10) };
      await axios.post("http://localhost:4000/api/regulations/addcourse", updatedCourse);
      
      setCourses((prevCourses) =>
        prevCourses
          .filter((course) => course.course_code !== fromCourseCode)
          .concat(updatedCourse)
      );
  
      alert("Course moved successfully!");
      setFromCourseCode(""); // Reset input fields
      setToSemester("");
    } catch (error) {
      console.error("Error moving course:", error);
      alert("Failed to move course. Try again.");
    }
  };

  

  return (
    <div>
      <h2>Regulations</h2>
      <label>Enter Regulation Year: </label>
      <input type="text" value={regulationYear} onChange={handleRegulationChange} />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-container">
          {[...Array(8)].map((_, semesterIndex) => {
            const semesterCourses = courses.filter(course => course.sem_no === semesterIndex + 1);
            if (semesterCourses.length === 0) return null;

            return (
              <div key={semesterIndex}>
                <h3>Semester {semesterIndex + 1}</h3>
                <table className="data-table" border="1">
                  <thead>
                    <tr>
                      <th>Serial No</th>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Lecture</th>
                      <th>Tutorial</th>
                      <th>Practical</th>
                      <th>Credits</th>
                      <th>Type</th>
                      <th>Faculty</th>
                      <th>Course Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterCourses.map((course) => (
                      <tr key={course.course_code}>
                        <td>{course.serial_no}</td>
                        <td>
                          <input 
                            value={
                              regulationYear.length === 2 
                                ? `${regulationYear}${course.course_code.slice(2)}` 
                                : course.course_code
                            }
                            onChange={(e) => handleChange(course.course_code, "course_code", e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            value={course.course_name || ""} 
                            onChange={(e) => handleChange(course.course_code, "course_name", e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={course.lecture || 0} 
                            onChange={(e) => handleChange(course.course_code, "lecture", e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={course.tutorial || 0} 
                            onChange={(e) => handleChange(course.course_code, "tutorial", e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={course.practical || 0} 
                            onChange={(e) => handleChange(course.course_code, "practical", e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={course.credits || 0} 
                            onChange={(e) => handleChange(course.course_code, "credits", e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            value={course.type || ""} 
                            onChange={(e) => handleChange(course.course_code, "type", e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            value={course.faculty || ""} 
                            onChange={(e) => handleChange(course.course_code, "faculty", e.target.value)} 
                          />
                        </td>
                        <td>
                          <input 
                            value={course.category || ""} 
                            onChange={(e) => handleChange(course.course_code, "category", e.target.value)} 
                          />
                        </td>
                        <td>
                          <button onClick={() => handleSubmit(course.course_code)}>Update</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          <div className="move-course">
            <h4>Move Course</h4>
            <label>Course Code:</label>
            <input
              type="text"
              value={fromCourseCode}
              onChange={(e) => setFromCourseCode(e.target.value)}
              placeholder="Enter course code"
            />
            <label>To Semester:</label>
            <input
              type="number"
              min="1"
              max="8"
              value={toSemester}
              onChange={(e) => setToSemester(e.target.value)}
            />
            <button onClick={handleMoveCourse}>Move</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Regulations;

