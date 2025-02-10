import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Course.css";

const Regulations = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regulationYear, setRegulationYear] = useState("");
  const [fromSerialNo, setFromSerialNo] = useState("");
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

  const handleChange = (index, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[index][field] = value;
    setCourses(updatedCourses);
  };

  const handleRegulationChange = (e) => {
    let year = e.target.value.trim();
    if (year.length >= 2) {
      year = year.slice(-2); // Get last two characters
    }
    setRegulationYear(year);
  };

  const handleSubmit = async (serial_no) => {
    const updatedCourse = courses.find((course) => course.serial_no === serial_no);
    try {
      await axios.put(`http://localhost:4000/api/regulations/updatecourse/${serial_no}`, updatedCourse);
      alert("Course updated successfully!");
    } catch (error) {
      console.error("Error updating course:", error);
    }
  };

  const handleMoveCourse = async () => {
    const serialNo = parseInt(fromSerialNo, 10); 
    const courseToMove = courses.find((course) => course.serial_no === serialNo);
  
    if (!courseToMove) {
      alert("Invalid Serial No. Please enter a valid one.");
      return;
    }
  
    if (!toSemester || isNaN(toSemester) || toSemester < 1 || toSemester > 8) {
      alert("Invalid Semester No. Please enter a valid semester (1-8).");
      return;
    }
  
    console.log(`Deleting course with serial_no:${serialNo}`); // Add this line
    console.log(`Moving to semester number:${toSemester}`);
  
    try {
      await axios.delete(`http://localhost:4000/api/regulations/deletecourse/${serialNo}`);
      console.log(`Deleted course with serial_no: ${serialNo}`); // Add this line
  
      const updatedCourse = { ...courseToMove, sem_no: parseInt(toSemester, 10) };
      await axios.post("http://localhost:4000/api/regulations/addcourse", updatedCourse);
      setCourses((prevCourses) =>
        prevCourses
          .filter((course) => course.serial_no !== serialNo)
          .concat(updatedCourse)
      );
  
      alert("Course moved successfully!");
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
            if (semesterCourses.length === 0) return null; // Skip empty semesters

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
                    {semesterCourses.map((course, index) => (
                      <tr key={course.serial_no}>
                        <td>{course.serial_no}</td>
                        <td>
                          <input 
                            value={
                              regulationYear.length === 2 
                                ? `${regulationYear}${course.course_code.slice(2)}` 
                                : course.course_code
                            }
                            onChange={(e) => handleChange(index, "course_code", e.target.value)} 
                          />
                        </td>
                        <td><input value={course.course_name} onChange={(e) => handleChange(index, "course_name", e.target.value)} /></td>
                        <td><input type="number" value={course.lecture || 0} onChange={(e) => handleChange(index, "lecture", e.target.value)} /></td>
                        <td><input type="number" value={course.tutorial || 0} onChange={(e) => handleChange(index, "tutorial", e.target.value)} /></td>
                        <td><input type="number" value={course.practical || 0} onChange={(e) => handleChange(index, "practical", e.target.value)} /></td>
                        <td><input type="number" value={course.credits || 0} onChange={(e) => handleChange(index, "credits", e.target.value)} /></td>
                        <td><input value={course.type || ""} onChange={(e) => handleChange(index, "type", e.target.value)} /></td>
                        <td><input value={course.faculty || ""} onChange={(e) => handleChange(index, "faculty", e.target.value)} /></td>
                        <td><input value={course.category || ""} onChange={(e) => handleChange(index, "category", e.target.value)} /></td>
                        <td><button onClick={() => handleSubmit(course.serial_no)}>Update</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

                <div className="move-course">
                  <h4>Move Course</h4>
                  <label>From Serial No:</label>
                  <input
                    type="text"
                    value={fromSerialNo}
                    onChange={(e) => setFromSerialNo(e.target.value)}
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

