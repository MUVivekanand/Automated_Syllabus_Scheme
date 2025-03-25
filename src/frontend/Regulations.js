import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import "../styles/Regulations.css";

const Regulations = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regulationYear, setRegulationYear] = useState("");
  const [fromCourseName, setFromCourseName] = useState("");
  const [toSemester, setToSemester] = useState("");
  const [newRows, setNewRows] = useState({});
  const [refresh, setRefresh] = useState(false);
  
  // Common information
  const [commonInfo, setCommonInfo] = useState({
    ca_marks: "",
    fe_marks: "",
    total_marks: ""
  });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const degree = searchParams.get('degree');
  const department = searchParams.get('department');

  useEffect(() => {
    fetchCourses();
  }, [refresh]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/regulations/allcourses", {
        params: { degree, department }
      });
  
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

  const handleCommonInfoChange = (field, value) => {
    setCommonInfo(prev => ({
      ...prev,
      [field]: value
    }));
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
          serial_no: nextSerialNo,
          degree: degree,
          department: department,
          ca_marks: commonInfo.ca_marks,
          fe_marks: commonInfo.fe_marks,
          total_marks: commonInfo.total_marks
        }
      ]
    }));
  };

  const handleSaveNewCourse = async (semesterNumber, rowIndex) => {
    const newCourse = {
      ...newRows[semesterNumber][rowIndex],
      degree: degree,
      department: department,
      ca_marks: commonInfo.ca_marks,
      fe_marks: commonInfo.fe_marks,
      total_marks: commonInfo.total_marks
    };
    
    try {
      const response = await axios.post("http://localhost:4000/api/regulations/addcourse", newCourse);
      setCourses(prev => [...prev, response.data]);
      
      // Remove the new row after successful save
      setNewRows(prev => ({
        ...prev,
        [semesterNumber]: prev[semesterNumber].filter((_, index) => index !== rowIndex)
      }));
      
      alert("Course added successfully!");
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error("Error adding course:", error);
      alert("Failed to add course: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (courseName) => {
    const updatedCourse = courses.find((course) => course.course_name === courseName);
    console.log("Course Name Frontend:", courseName);

    if (!updatedCourse) {
      alert("Course not found!");
      return;
    }
  
    try {
      await axios.put(`http://localhost:4000/api/regulations/updatecourse/${courseName}`, {
        ...updatedCourse,
        degree,
        department
      });
      alert("Course updated successfully!");
      setRefresh((prev) => !prev);
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
      await axios.delete(`http://localhost:4000/api/regulations/deletemovecourse/${fromCourseName}`, {
        data: { degree, department }
      });
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

  const handleDelete = async (courseName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete course ${courseName}?`);
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`http://localhost:4000/api/regulations/delete-course/${courseName}`, {
        data: { degree, department }
      });

      if (response.status === 200) {
        setCourses((prevCourses) => prevCourses.filter((course) => course.course_name !== courseName));
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert(error.response?.data?.error || "Failed to delete course.");
    }
  };

  return (
    <div>
      <h2>New Regulations</h2>

      {/* Common Information Section */}
      <div className="common-info-reg-section">
          <h3>Common Information</h3>
          <div className="common-info-reg-grid">
            <div>
              <label>Degree:</label>
              <input type="text" value={degree || ""} readOnly />
            </div>
            <div>
              <label>Department:</label>
              <input type="text" value={department || ""} readOnly />
            </div>
            <div>
              <label>CA Marks:</label>
              <input 
                type="number" 
                value={commonInfo.ca_marks} 
                onChange={(e) => handleCommonInfoChange("ca_marks", e.target.value)} 
              />
            </div>
            <div>
              <label>FE Marks:</label>
              <input 
                type="number" 
                value={commonInfo.fe_marks} 
                onChange={(e) => handleCommonInfoChange("fe_marks", e.target.value)} 
              />
            </div>
            <div>
              <label>Total Marks:</label>
              <input 
                type="number" 
                value={commonInfo.total_marks} 
                onChange={(e) => handleCommonInfoChange("total_marks", e.target.value)} 
              />
            </div>
          </div>
        </div>

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
                          <button onClick={() => handleSubmit(course.course_name)}>Update</button>
                          <button onClick={() => handleDelete(course.course_name)}>Delete</button>
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