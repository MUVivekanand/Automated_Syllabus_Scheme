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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/regulations/allcourses`, {
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

  // Updated to track both old and new course names for proper updates
  const handleChange = (courseName, field, value, currentDegree, currentDepartment) => {
    setCourses(prevCourses => 
      prevCourses.map(course => {
        // Match using composite key
        if (course.course_name === courseName && 
            course.degree === currentDegree && 
            course.department === currentDepartment) {
          const updatedCourse = { 
            ...course, 
            [field]: field === "serial_no" ? parseInt(value) || 0 : value 
          };
          
          // Store original composite key for updates
          if (!updatedCourse._originalKey) {
            updatedCourse._originalKey = {
              course_name: courseName,
              degree: currentDegree,
              department: currentDepartment
            };
          }
          
          return updatedCourse;
        }
        return course;
      })
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
          ca_marks: commonInfo.ca_marks || 0,
          fe_marks: commonInfo.fe_marks || 0,
          total_marks: commonInfo.total_marks || 0
        }
      ]
    }));
  };

  const handleSaveNewCourse = async (semesterNumber, rowIndex) => {
    const newCourse = {
      ...newRows[semesterNumber][rowIndex],
      degree: degree,
      department: department,
      ca_marks: parseFloat(commonInfo.ca_marks) || 0,
      fe_marks: parseFloat(commonInfo.fe_marks) || 0,
      total_marks: parseFloat(commonInfo.total_marks) || 0
    };

    // Validate course name
    if (!newCourse.course_name || newCourse.course_name.trim() === '') {
      alert("Course name is required!");
      return;
    }
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/regulations/addcourse`, newCourse);
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
      const errorMsg = error.response?.data?.message || error.message;
      alert("Failed to add course: " + errorMsg);
    }
  };

  const handleSubmit = async (course) => {
    console.log("Submitting course update:", course);

    if (!course) {
      alert("Course not found!");
      return;
    }

    // Get the original key if course name was changed
    const originalKey = course._originalKey || {
      course_name: course.course_name,
      degree: course.degree,
      department: course.department
    };

    // If course_name changed, we need to delete old and insert new
    if (originalKey.course_name !== course.course_name) {
      try {
        // Delete the old record using original composite key
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/regulations/delete-course/${encodeURIComponent(originalKey.course_name)}`,
          {
            data: { 
              degree: originalKey.degree, 
              department: originalKey.department 
            }
          }
        );

        // Insert new record with updated course name
        await axios.post(`${process.env.REACT_APP_API_URL}/api/regulations/addcourse`, {
          ...course,
          degree,
          department
        });

        alert("Course updated successfully!");
        setRefresh((prev) => !prev);
      } catch (error) {
        console.error("Error updating course with name change:", error);
        alert("Failed to update course: " + (error.response?.data?.message || error.message));
      }
    } else {
      // Normal update without course_name change
      try {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/regulations/updatecourse/${encodeURIComponent(course.course_name)}`,
          {
            ...course,
            degree,
            department
          }
        );
        alert("Course updated successfully!");
        setRefresh((prev) => !prev);
      } catch (error) {
        console.error("Error updating course:", error);
        alert("Failed to update course: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleMoveCourse = async () => {
    const courseToMove = courses.find((course) => 
      course.course_name === fromCourseName && 
      course.degree === degree && 
      course.department === department
    );
  
    if (!courseToMove) {
      alert("Invalid Course Name. Please enter a valid one.");
      return;
    }
  
    if (!toSemester || isNaN(toSemester) || toSemester < 1 || toSemester > 8) {
      alert("Invalid Semester No. Please enter a valid semester (1-8).");
      return;
    }
  
    try {
      // Delete the old course with composite key
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/regulations/deletemovecourse/${encodeURIComponent(fromCourseName)}`,
        {
          data: { degree, department }
        }
      );
      
      // Add the course with new semester
      const updatedCourse = { 
        ...courseToMove, 
        sem_no: parseInt(toSemester, 10),
        degree,
        department
      };
      await axios.post(`${process.env.REACT_APP_API_URL}/api/regulations/addcourse`, updatedCourse);
      
      setCourses((prevCourses) =>
        prevCourses
          .filter((course) => !(
            course.course_name === fromCourseName && 
            course.degree === degree && 
            course.department === department
          ))
          .concat(updatedCourse)
      );
  
      alert("Course moved successfully!");
      setFromCourseName("");
      setToSemester("");
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error("Error moving course:", error);
      alert("Failed to move course: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (course) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete course ${course.course_name}?`);
    if (!confirmDelete) return;

    try {
      // Send composite key in request body
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/regulations/delete-course/${encodeURIComponent(course.course_name)}`,
        {
          data: { 
            degree: course.degree, 
            department: course.department 
          }
        }
      );

      if (response.status === 200) {
        setCourses((prevCourses) => 
          prevCourses.filter((c) => !(
            c.course_name === course.course_name && 
            c.degree === course.degree && 
            c.department === course.department
          ))
        );
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to delete course.");
    }
  };

  const handleConfirmRegulation = async () => {
    if (!degree || !department) {
      alert("Degree and department information is required!");
      return;
    }
  
    if (!regulationYear) {
      alert("Regulation year is required!");
      return;
    }
  
    try {
      setLoading(true);
      
      // Process the existing courses
      const coursesToSubmit = courses.map(course => {
        return {
          course_code: regulationYear.length === 2 
            ? `${regulationYear}${course.course_code.slice(2)}` 
            : course.course_code,
          course_name: course.course_name,
          sem_no: course.sem_no,
          degree,
          department,
          lecture: course.lecture || 0,
          tutorial: course.tutorial || 0,
          practical: course.practical || 0,
          credits: course.credits || 0,
          type: course.type || "",
          faculty: course.faculty || "",
          category: course.category || "",
          serial_no: course.serial_no || 0
        };
      });
      
      // Process any new rows
      Object.keys(newRows).forEach(sem => {
        if (newRows[sem]?.length > 0) {
          newRows[sem].forEach(row => {
            if (row.course_code && row.course_name) {
              coursesToSubmit.push({
                course_code: row.course_code,
                course_name: row.course_name,
                sem_no: parseInt(sem),
                degree,
                department,
                lecture: row.lecture || 0,
                tutorial: row.tutorial || 0,
                practical: row.practical || 0,
                credits: row.credits || 0,
                type: row.type || "",
                faculty: row.faculty || "",
                category: row.category || "",
                serial_no: row.serial_no || 0
              });
            }
          });
        }
      });
  
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/regulations/confirm-regulation`, {
        courses: coursesToSubmit,
        degree,
        department,
        regulationYear
      });
      
      console.log("Regulation confirmed successfully:", response.data);
      alert(`Regulation confirmed successfully! Saved with department: ${response.data.department}`);
      setRefresh((prev) => !prev);
      
    } catch (error) {
      console.error("Error confirming regulation:", error);
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Failed to confirm regulation: ${errorMessage}`);
    } finally {
      setLoading(false);
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
        </div>
      </div>

      <div className="regulation-controls">
        <label>Enter Regulation Year: </label>
        <input type="text" value={regulationYear} onChange={handleRegulationChange} />
        <button 
          className="confirm-regulation-btn"
          onClick={handleConfirmRegulation}
          style={{ 
            marginLeft: '10px',
            padding: '8px 16px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Confirm Regulation
        </button>
      </div>

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
                      <tr key={`${course.degree}-${course.department}-${course.course_name}`}>
                        <td>
                          <input 
                            type="number"
                            value={course.serial_no || 0}
                            onChange={(e) => handleChange(course.course_name, "serial_no", e.target.value, course.degree, course.department)}
                          />
                        </td>
                        <td>
                          <input 
                            value={
                              regulationYear.length === 2 
                                ? `${regulationYear}${course.course_code.slice(2)}` 
                                : course.course_code
                            }
                            onChange={(e) => handleChange(course.course_name, "course_code", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <input 
                            value={course.course_name || ""} 
                            onChange={(e) => handleChange(course.course_name, "course_name", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={course.lecture || 0} 
                            onChange={(e) => handleChange(course.course_name, "lecture", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={course.tutorial || 0} 
                            onChange={(e) => handleChange(course.course_name, "tutorial", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={course.practical || 0} 
                            onChange={(e) => handleChange(course.course_name, "practical", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={course.credits || 0} 
                            onChange={(e) => handleChange(course.course_name, "credits", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <input 
                            value={course.type || ""} 
                            onChange={(e) => handleChange(course.course_name, "type", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <input 
                            value={course.faculty || ""} 
                            onChange={(e) => handleChange(course.course_name, "faculty", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <input 
                            value={course.category || ""} 
                            onChange={(e) => handleChange(course.course_name, "category", e.target.value, course.degree, course.department)} 
                          />
                        </td>
                        <td>
                          <button onClick={() => handleSubmit(course)}>Update</button>
                          <button onClick={() => handleDelete(course)}>Delete</button>
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
                            placeholder="Enter course name"
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