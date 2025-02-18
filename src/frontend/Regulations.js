import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Course.css";

const Regulations = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regulationYear, setRegulationYear] = useState("");
  const [fromCourseName, setFromCourseName] = useState("");
  const [toSemester, setToSemester] = useState("");
  const [newRows, setNewRows] = useState({});

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
      year = year.slice(-2);
    }
    setRegulationYear(year);
  };


    const handleChange = (courseCode, field, value) => {
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.course_code === courseCode
            ? { ...course, [field]: field === "serial_no" ? parseInt(value) || 0 : value }
            : course
        )
      );
  };

  const handleNewRowChange = (semesterNumber, rowIndex, field, value) => {
    setNewRows(prev => ({
      ...prev,
      [semesterNumber]: prev[semesterNumber].map((row, index) => 
        index === rowIndex 
          ? { ...row, [field]: field === "serial_no" ? parseInt(value) || 0 : value }
          : row
      )
    }));
  };

    const handleAddRow = (semesterNumber) => {
      const semesterCourses = courses.filter(course => course.sem_no === semesterNumber);
      const existingNewRows = newRows[semesterNumber] || [];
      
      // Calculate default serial number based on existing courses and new rows
      const maxExistingSerialNo = Math.max(
        ...semesterCourses.map(course => course.serial_no || 0),
        ...existingNewRows.map(row => row.serial_no || 0),
        0
      );
      const nextSerialNo = maxExistingSerialNo + 1;
    
      setNewRows(prev => ({
        ...prev,
        [semesterNumber]: [
          ...(prev[semesterNumber] || []),
          {
            course_code: regulationYear.length === 2 ? `${regulationYear}` : '',
            course_name: '',
            lecture: 0,
            tutorial: 0,
            practical: 0,
            credits: 0,
            type: '',
            faculty: '',
            category: '',
            sem_no: semesterNumber,
            serial_no: nextSerialNo  // This will be a default value that can be edited
          }
        ]
      }));
    };

  const handleSaveNewCourse = async (semesterNumber, rowIndex) => {
    const newCourse = newRows[semesterNumber][rowIndex];
    
    try {
      const response = await axios.post("http://localhost:4000/api/regulations/addcourse", newCourse);
      setCourses(prev => [...prev, response.data]);
      
      // Remove the new row after successful save
      setNewRows(prev => ({
        ...prev,
        [semesterNumber]: prev[semesterNumber].filter((_, index) => index !== rowIndex)
      }));
      
      alert("Course added successfully!");
    } catch (error) {
      console.error("Error adding course:", error);
      alert("Failed to add course");
    }
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
    const courseToMove = courses.find((course) => course.course_name === fromCourseName);
  
    if (!courseToMove) {
      alert("Invalid Course Name. Please enter a valid one.");
      return;
    }
  
    if (!toSemester || isNaN(toSemester) || toSemester < 1 || toSemester > 8) {
      alert("Invalid Semester No. Please enter a valid semester (1-8).");
      return;
    }
  
    try {
      await axios.delete(`http://localhost:4000/api/regulations/deletemovecourse/${fromCourseName}`);
      const updatedCourse = { ...courseToMove, sem_no: parseInt(toSemester, 10) };
      await axios.post("http://localhost:4000/api/regulations/addcourse", updatedCourse);
      
      setCourses((prevCourses) =>
        prevCourses
          .filter((course) => course.course_name !== fromCourseName)
          .concat(updatedCourse)
      );
  
      alert("Course moved successfully!");
      setFromCourseName("");
      setToSemester("");
    } catch (error) {
      console.error("Error moving course:", error);
      alert("Failed to move course. Try again.");
    }
  };
  

  const handleDelete = async (courseCode) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete course ${courseCode}?`);
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`http://localhost:4000/api/regulations/delete-course/${courseCode}`);

      if (response.status === 200) {
        setCourses((prevCourses) => prevCourses.filter((course) => course.course_code !== courseCode));
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert(error.response?.data?.error || "Failed to delete course.");
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
            const semesterNumber = semesterIndex + 1;
            const semesterCourses = courses.filter(course => course.sem_no === semesterNumber);
            const hasNewRows = newRows[semesterNumber]?.length > 0;
            
            if (semesterCourses.length === 0 && !hasNewRows) return null;

            return (
              <div key={semesterIndex}>
                <h3>Semester {semesterNumber}</h3>
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
                        <td>
                          <input 
                            type="number"
                            value={course.serial_no || 0}
                            onChange={(e) => handleChange(course.course_code, "serial_no", e.target.value)}
                          />
                        </td>
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
                          <button onClick={() => handleDelete(course.course_code)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    
                    {/* New empty rows */}
                    {newRows[semesterNumber]?.map((newRow, rowIndex) => (
                      <tr key={`new-${semesterNumber}-${rowIndex}`}>
                        <td>
                          <input 
                            type="number"
                            value={newRow.serial_no || 0}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "serial_no", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            value={newRow.course_code || ''}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "course_code", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            value={newRow.course_name || ''}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "course_name", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            value={newRow.lecture}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "lecture", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            value={newRow.tutorial}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "tutorial", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            value={newRow.practical}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "practical", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            value={newRow.credits}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "credits", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            value={newRow.type}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "type", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            value={newRow.faculty}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "faculty", e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            value={newRow.category}
                            onChange={(e) => handleNewRowChange(semesterNumber, rowIndex, "category", e.target.value)}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleSaveNewCourse(semesterNumber, rowIndex)}>Save</button>
                          <button onClick={() => {
                            setNewRows(prev => ({
                              ...prev,
                              [semesterNumber]: prev[semesterNumber].filter((_, i) => i !== rowIndex)
                            }));
                          }}>Cancel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button 
                  className="add-course-btn"
                  onClick={() => handleAddRow(semesterNumber)}
                  style={{ 
                    marginTop: '10px',
                    marginBottom: '20px',
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add Course
                </button>
              </div>
            );
          })}

          <div className="move-course">
            <h4>Move Course</h4>
            <label>Course Title:</label>
            <input
              type="text"
              value={fromCourseName}
              onChange={(e) => setFromCourseName(e.target.value)}
              placeholder="Enter course title"
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


