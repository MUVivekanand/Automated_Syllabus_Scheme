import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../styles/Course.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

function CourseMe() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    // Get values from query parameters
    const [degree, setDegree] = useState("M.E"); // Default to "M.E"
    const [department, setDepartment] = useState("CSE"); // Default to "CSE"

    const [professionalElectives, setProfessionalElectives] = useState([]);

  const [currentSem, setCurrentSem] = useState(1);
  const [commonInfo, setCommonInfo] = useState({
    semNo: currentSem,
    totalCredits: 0,
    practicalCourses: 0,
    theoryCourses: 0,
    caMarks: "",
    feMarks: "",
    totalMarks: "",
    department: "",
    degree: "",
  });
  const [courses, setCourses] = useState([]);
  const [existingCourses, setExistingCourses] = useState([]);
  const [totalRow, setTotalRow] = useState({
    lecture: 0,
    tutorial: 0,
    practical: 0,
    credits: 0,
  });
  const [filterForm, setFilterForm] = useState({
    filterSem: "",
    FilterDep: "",
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [originalCourseNames, setOriginalCourseNames] = useState({});

  const navigate = useNavigate();

  const navigateSummary = () => {
    navigate(`/Summary?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`);
  };

  const navigateProfessional = () => {
    navigate(`/ProfessionalMe?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`);

}

  const navigateWordPage = () => {
    navigate(`/MewordPage?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`);
  }
     
const fetchData = async () => {
    try {
      setCourses([]);
      setExistingCourses([]);
      setTotalRow({ lecture: 0, tutorial: 0, practical: 0, credits: 0 });
  
      // Pass degree and department as query parameters
      const semResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/course/seminfo/${currentSem}`, {
        params: { degree, department }
      });
      const semInfo = semResponse.data;
  
      // Create empty course templates - combine all courses as theory
      const totalCourses = (semInfo.theory_courses || 0) + 
                           (semInfo.practical_courses || 0) + 
                           (semInfo.mandatory_courses || 0);
      
      const emptyRows = Array.from({ length: totalCourses }, () => ({
        serial_no: "",
        courseCode: "",
        courseTitle: "",
        lecture: 0,
        tutorial: 0,
        practical: 0,
        credits: 0,
        type: "",
        faculty: "",
        courseType: "theory"  // All courses are theory now
      }));
  
      // Fetch existing courses with degree parameter
      const coursesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/course/courses/${currentSem}`, {
        params: { degree, department }
      });
      const existingCoursesData = coursesResponse.data;
      
      // Convert all existing courses to theory regardless of original category
      const theoryCoursesData = existingCoursesData.map(course => ({
        serial_no: course.serial_no,
        courseCode: course.course_code,
        courseTitle: course.course_name,
        lecture: course.lecture,
        tutorial: course.tutorial,
        practical: course.practical,
        credits: course.credits,
        type: course.type,
        faculty: course.faculty,
        courseType: "theory"  // Set all to theory
      }));
  
      // Sort by serial number
      theoryCoursesData.sort((a, b) => a.serial_no - b.serial_no);
  
      // Merge existing courses with empty rows
      const mergedCourses = theoryCoursesData.concat(
        emptyRows.slice(theoryCoursesData.length)
      );
  
      // Store original course names with their indices
      const originalNames = {};
      mergedCourses.forEach((course, index) => {
        if (course.courseTitle) {
          originalNames[index] = course.courseTitle;
        }
      });
      setOriginalCourseNames(originalNames);
  
      setCourses(mergedCourses);
      setExistingCourses(existingCoursesData);
      
      // Update common info - combine all course types
      setCommonInfo(prev => ({
        ...prev,
        theoryCourses: totalCourses,
        practicalCourses: 0,
        mandatoryCourses: 0,
        semNo: currentSem,
        degree: degree
      }));
      
      calculateTotalRow(mergedCourses);
    } catch (error) {
      console.error("Error fetching data:", error);
      resetStates();
    }
  };

  const updateCommonInfo = (semInfo) => {
    setCommonInfo(prev => ({
      ...prev,
      practicalCourses: semInfo.practical_courses,
      theoryCourses: semInfo.theory_courses,
      mandatoryCourses: semInfo.mandatory_courses || 0,
      semNo: currentSem,
      degree: degree
    }));
  };

  const calculateTotalRow = (courseData) => {
    const totals = courseData.reduce(
      (acc, course) => ({
        lecture: acc.lecture + Number(course.lecture || 0),
        tutorial: acc.tutorial + Number(course.tutorial || 0),
        practical: acc.practical + Number(course.practical || 0),
        credits: acc.credits + Number(course.credits || 0),
      }),
      { lecture: 0, tutorial: 0, practical: 0, credits: 0 }
    );
    setTotalRow(totals);
  };

  const resetStates = () => {
    setCourses([]);
    setExistingCourses([]);
    setTotalRow({ lecture: 0, tutorial: 0, practical: 0, credits: 0 });
  };

  // Update common info change handler
  const handleCommonInfoChange = useCallback((e) => {
    const { name, value } = e.target;
    setCommonInfo(prev => ({ ...prev, [name]: value }));
  }, []);

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch table data
  const fetchTableData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/course/getTableData`);
      if (response.data.success) {
        setTableData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Calculate credits function
  function calculateCredits(lecture, tutorial, practical) {
    const parsedLecture = isNaN(lecture) || lecture === "" ? 0 : parseInt(lecture);
    const parsedTutorial = isNaN(tutorial) || tutorial === "" ? 0 : parseInt(tutorial);
    const parsedPractical = isNaN(practical) || practical === "" ? 0 : parseInt(practical);
    
    let credits = 0;
  
    // Check practical-only cases first
    if (parsedPractical === 4 && parsedLecture === 0 && parsedTutorial === 0) {
      credits = 2; // Practical-only case with 4 practicals
    } else if (parsedPractical === 2 && parsedLecture === 0 && parsedTutorial === 0) {
      credits = 1; // Practical-only case with 2 practicals
    }
    else if (parsedPractical == 8 && parsedLecture ===0 && parsedTutorial === 0){
      credits = 4;
    }
    // Check lecture and tutorial combinations
    else if (parsedLecture + parsedTutorial === 4) {
      credits = 4; // Combination of lecture and tutorial adds up to 4
    } else if (parsedLecture + parsedTutorial === 3) {
      credits = 3; // Combination of lecture and tutorial adds up to 3
    } else {
      credits = parsedLecture + parsedTutorial + parsedPractical; // Default case
    }
  
    return credits;
  }

  // Handle course changes
  const handleCourseChange = useCallback((index, field, value) => {
    setCourses(prevCourses => {
      const updatedCourses = [...prevCourses];
      updatedCourses[index] = {
        ...updatedCourses[index],
        [field]: value,
      };
    
      // Recalculate credits
      const lecture = Number(updatedCourses[index].lecture || 0);
      const tutorial = Number(updatedCourses[index].tutorial || 0);
      const practical = Number(updatedCourses[index].practical || 0);
      updatedCourses[index].credits = calculateCredits(lecture, tutorial, practical);
    
      // Recalculate total row
      const totals = updatedCourses.reduce(
        (acc, course) => ({
          lecture: acc.lecture + Number(course.lecture || 0),
          tutorial: acc.tutorial + Number(course.tutorial || 0),
          practical: acc.practical + Number(course.practical || 0),
          credits: acc.credits + Number(course.credits || 0),
        }),
        { lecture: 0, tutorial: 0, practical: 0, credits: 0 }
      );
    
      setTotalRow(totals);
      return updatedCourses;
    });
  }, []);
  

// const handleSubmit = useCallback(async () => {
//   try {
//     for (let i = 0; i < courses.length; i++) {
//       const course = courses[i];
//       const originalName = originalCourseNames[i];
      
//       // Skip empty courses
//       if (!course.courseTitle) continue;
      
//       // Use the department from the UI selection
//       const courseDepartment = department || commonInfo.department || '';
      
//       // Prepare the course data
//       const courseData = {
//         serial_no: course.serial_no || 0,
//         course_code: course.courseCode || '',
//         lecture: course.lecture || 0,
//         tutorial: course.tutorial || 0,
//         practical: course.practical || 0,
//         credits: course.credits || 0,
//         ca_marks: commonInfo.caMarks || 0,
//         fe_marks: commonInfo.feMarks || 0,
//         total_marks: commonInfo.totalMarks || 0,
//         type: course.type || '',
//         faculty: course.faculty || '',
//         department: courseDepartment,
//         degree: degree || commonInfo.degree || '',
//         sem_no: currentSem,
//         category: "theory"
//       };
      
//       try {
//         if (originalName) {
//           // This is an existing course
//           if (originalName !== course.courseTitle) {
//             // Course name changed - delete old record first
//             await axios.delete(`${process.env.REACT_APP_API_URL}api/course/credits/${encodeURIComponent(originalName)}`);
//             // Then create new record
//             await axios.post(`${process.env.REACT_APP_API_URL}api/course/credits`, {
//               ...courseData,
//               course_name: course.courseTitle
//             });
//           } else {
//             // Update existing course
//             await axios.patch(`${process.env.REACT_APP_API_URL}api/course/credits/${encodeURIComponent(course.courseTitle)}`, courseData);
//           }
//         } else {
//           // This is a new course - use POST instead of PATCH
//           await axios.post(`${process.env.REACT_APP_API_URL}api/course/credits`, {
//             ...courseData,
//             course_name: course.courseTitle
//           });
//         }
//       } catch (error) {
//         console.error(`Error with course ${course.courseTitle}:`, error.response?.data || error.message);
//         alert(`Failed to update course ${course.courseTitle}: ${error.response?.data?.message || error.message}`);
//       }
//     }
    
//     alert("Data updated successfully!");
//     fetchData(); // Refresh data to get updated records
//   } catch (error) {
//     console.error("Error in submission process:", error);
//     alert("Failed to update data: " + (error.response?.data?.message || error.message));
//   }
// }, [courses, commonInfo, currentSem, originalCourseNames, department, degree]);

const handleSubmit = useCallback(async () => {
  try {
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const originalName = originalCourseNames[i];
      
      if (course.courseTitle) {
        if (originalName && originalName !== course.courseTitle) {
          try {
            // First delete the old record - the backend will handle related records
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/course/credits/${encodeURIComponent(originalName)}`);
          } catch (deleteError) {
            console.error("Error deleting old course record:", deleteError);
            // Continue with update attempt even if delete fails
          }
        }
        
        try {
          // Create or update with new course data
          await axios.patch(`${process.env.REACT_APP_API_URL}/api/course/credits/${encodeURIComponent(course.courseTitle)}`, {
            serial_no: course.serial_no || 0,
            course_code: course.courseCode || '',
            lecture: course.lecture || 0,
            tutorial: course.tutorial || 0,
            practical: course.practical || 0,
            credits: course.credits || 0,
            ca_marks: commonInfo.caMarks || 0,
            fe_marks: commonInfo.feMarks || 0,
            total_marks: commonInfo.totalMarks || 0,
            type: course.type || '',
            faculty: course.faculty || '',
            department: department || commonInfo.department || '',
            degree: degree || commonInfo.degree || '',
            sem_no: currentSem,
            category: "theory"
          });
        } catch (updateError) {
          console.error(`Error updating course ${course.courseTitle}:`, updateError.response?.data || updateError.message);
          // Alert about specific course update failure but continue with others
          alert(`Failed to update course ${course.courseTitle}: ${updateError.response?.data?.message || updateError.message}`);
        }
      }
    }
    
    alert("Data updated successfully!");
    fetchData(); // Refresh data to get updated records
  } catch (error) {
    console.error("Error in submission process:", error);
    alert("Failed to update data: " + (error.response?.data?.message || error.message));
  }
}, [courses, commonInfo, currentSem, originalCourseNames, department, degree]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentSem < 8) {
      setCurrentSem(prev => prev + 1);
      setCommonInfo(prev => ({
        ...prev,
        caMarks: "",
        feMarks: "",
        totalMarks: "",
        department: prev.department,
        degree: prev.degree
      }));
    }
  }, [currentSem]);

  const [semesterOptions, setSemesterOptions] = useState([
    { value: 1, label: 'Semester 1' },
    { value: 2, label: 'Semester 2' },
    { value: 3, label: 'Semester 3' },
    { value: 4, label: 'Semester 4' },
    { value: 5, label: 'Semester 5' },
    { value: 6, label: 'Semester 6' },
    { value: 7, label: 'Semester 7' },
    { value: 8, label: 'Semester 8' }
  ]);


  // Effect to update semester options based on degree
  useEffect(() => {
    if (degree === "M.E") {
      // If M.E is selected, only show semesters 1-4
      setSemesterOptions([
        { value: 1, label: 'Semester 1' },
        { value: 2, label: 'Semester 2' },
        { value: 3, label: 'Semester 3' },
        { value: 4, label: 'Semester 4' }
      ]);
      
      // If current semester is beyond 4, reset to semester 1
      if (currentSem > 4) {
        setCurrentSem(1);
        setCommonInfo(prev => ({
          ...prev,
          semNo: 1
        }));
      }
    } else {
      // For B.E, show all 8 semesters
      setSemesterOptions([
        { value: 1, label: 'Semester 1' },
        { value: 2, label: 'Semester 2' },
        { value: 3, label: 'Semester 3' },
        { value: 4, label: 'Semester 4' },
        { value: 5, label: 'Semester 5' },
        { value: 6, label: 'Semester 6' },
        { value: 7, label: 'Semester 7' },
        { value: 8, label: 'Semester 8' }
      ]);
      
      // Reset department when switching to B.E
    }
  }, [degree]);

  // Update this handler for degree change
  const handleDegreeChange = (e) => {
    const selectedDegree = e.target.value;
    setDegree(selectedDegree);
    setCommonInfo(prev => ({
        ...prev,
        degree: selectedDegree
    }));

    // Automatically set department to "CSE" if M.E is selected
    if (selectedDegree === "M.E") {
        setDepartment("CSE");
    }
    if(selectedDegree == 'B.E'){
      navigate('/syllabus')
    }
};

  
  // Update department handler
  const handleDepartmentChange = (e) => {
    if (degree !== "M.E") {
        setDepartment(e.target.value);
    }
};


  const handleSemesterChange = useCallback((e) => {
    const semNumber = parseInt(e.target.value);
    setCurrentSem(semNumber);
    setCommonInfo(prev => ({
      ...prev,
      caMarks: "",
      feMarks: "",
      totalMarks: "",
      semNo: semNumber
      // Preserving department and degree by not overwriting them
    }));
  }, []);


  const handleBack = useCallback(() => {
    if (currentSem > 1) {
      setCurrentSem(prev => prev - 1);
      setCommonInfo(prev => ({
        ...prev,
        caMarks: "",
        feMarks: "",
        totalMarks: "",
        department: "",
        degree: ""
      }));
    }
  }, [currentSem]);

  useEffect(() => {
    fetchData();
  }, [currentSem, degree, department]);

  // Rest of the component remains the same as in the original code...

  return (
    <div className="container-course">
      <h1>Course Details - Semester {currentSem}</h1>

      <div className="dropdown-container">
        <div>
            <label>Degree: </label>
            <select value={degree} onChange={handleDegreeChange}>
                <option value="B.E">B.E</option>
                <option value="M.E">M.E</option>
            </select>
        </div>

        <div>
            <label>Department: </label>
            <select
                value={department}
                onChange={handleDepartmentChange}
                disabled={degree === "M.E"} // Disable if M.E is selected
            >
                {degree === "M.E" ? (
                    <option value="CSE">CSE</option>
                ) : (
                    <>
                        <option value="CSE">CSE</option>
                        <option value="CSE AI-ML">CSE AI-ML</option>
                    </>
                )}
            </select>
        </div>
    </div>
                


      {/* Common Information Section */}
<div className="form-container">
  <h3>Common Information</h3>
  <div className="form-fields">
    <div>
      <label>Semester Number:</label>
      <input type="number" value={commonInfo.semNo} readOnly />
    </div>
    <div>
      <label>Total Courses:</label>
      <input type="number" value={commonInfo.theoryCourses} readOnly />
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
    <div>
      <label>Degree:</label>
      <input
        type="text"
        name="degree"
        value={commonInfo.degree}
        onChange={handleCommonInfoChange}
      />
    </div>
  </div>
</div>

{/* Course Details Input Section */}
<div className="table-container">
  <h2>Course Details</h2>

  {/* Theory Courses Section - All courses are now theory */}
  <h4>Courses</h4>
  <table className="data-table">
    <thead>
      <tr>
        <th>Serial No</th>
        <th className="wide-column">Course Code</th>
        <th className="extra-wide-column">Course Title</th>
        <th>Lecture</th>
        <th>Tutorial</th>
        <th>Practical</th>
        <th>Credits</th>
        <th className="wide-column">Type</th>
        <th className="wide-column">Faculty Assigned</th>
      </tr>
    </thead>
    <tbody>
      {courses.map((course, index) => (
        <tr key={`course-${index}`}>
          <td>
            <input
              type="number"
              value={course.serial_no || ""}
              onChange={(e) => handleCourseChange(index, "serial_no", e.target.value)}
            />
          </td>
          <td>
            <input
              type="text"
              value={course.courseCode || ""}
              onChange={(e) => handleCourseChange(index, "courseCode", e.target.value)}
            />
          </td>
          <td>
            <input
              type="text"
              value={course.courseTitle || ""}
              onChange={(e) => handleCourseChange(index, "courseTitle", e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              value={course.lecture || ""}
              onChange={(e) => handleCourseChange(index, "lecture", e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              value={course.tutorial || ""}
              onChange={(e) => handleCourseChange(index, "tutorial", e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              value={course.practical || ""}
              onChange={(e) => handleCourseChange(index, "practical", e.target.value)}
            />
          </td>
          <td>
            <span>{course.credits}</span>
          </td>
          <td>
            <input
              type="text"
              value={course.type || ""}
              onChange={(e) => handleCourseChange(index, "type", e.target.value)}
            />
          </td>
          <td>
            <input
              type="text"
              value={course.faculty || ""}
              onChange={(e) => handleCourseChange(index, "faculty", e.target.value)}
            />
          </td>
        </tr>
      ))}
    </tbody>
    <tbody>
      <tr className="total-row">
        <td colSpan="3" style={{ textAlign: "center", fontWeight: "bold" }}>Total</td>
        <td style={{ textAlign: "center", fontWeight: "bold" }}>{totalRow.lecture}</td>
        <td style={{ textAlign: "center", fontWeight: "bold" }}>{totalRow.tutorial}</td>
        <td style={{ textAlign: "center", fontWeight: "bold" }}>{totalRow.practical}</td>
        <td style={{ textAlign: "center", fontWeight: "bold" }}>{totalRow.credits}</td>
        <td colSpan="2"></td>
      </tr>
    </tbody>
  </table>
</div>

{/* Existing Courses Section */}
{existingCourses.length > 0 && (
  <div className="existing-courses-container">
    <h2>Existing Courses for Semester-{currentSem}</h2>
    
    {/* All Courses - No categorization */}
    <h4>Courses</h4>
    <table className="existing-courses-table">
      <thead>
        <tr>
          <th>Course Code</th>
          <th>Course Title</th>
          <th>Lecture</th>
          <th>Tutorial</th>
          <th>Practical</th>
          <th>Credits</th>
          <th>CA</th>
          <th>FE</th>
          <th>Total</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {existingCourses.map((course, index) => (
          <tr key={`course-${index}`}>
            <td>{course.course_code}</td>
            <td>{course.course_name}</td>
            <td>{course.lecture}</td>
            <td>{course.tutorial}</td>
            <td>{course.practical}</td>
            <td>{course.credits}</td>
            <td>{course.ca_marks}</td>
            <td>{course.fe_marks}</td>
            <td>{course.total_marks}</td>
            <td>{course.type}</td>
          </tr>
        ))}
      </tbody>
      <tbody>
        <tr className="total-row">
          <td colSpan="2" style={{ fontWeight: "bold" }}>Total</td>
          <td>{existingCourses.reduce((sum, course) => sum + course.lecture, 0)}</td>
          <td>{existingCourses.reduce((sum, course) => sum + course.tutorial, 0)}</td>
          <td>{existingCourses.reduce((sum, course) => sum + course.practical, 0)}</td>
          <td>{existingCourses.reduce((sum, course) => sum + course.credits, 0)}</td>
          <td>{existingCourses.reduce((sum, course) => sum + course.ca_marks, 0)}</td>
          <td>{existingCourses.reduce((sum, course) => sum + course.fe_marks, 0)}</td>
          <td>{existingCourses.reduce((sum, course) => sum + course.total_marks, 0)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
)}

      <div className="semester-navigation">
        <div className="semester-selector">
          <label htmlFor="semester-select">Select Semester: </label>
          <select 
            id="semester-select" 
            value={currentSem}
            onChange={handleSemesterChange}
            className="semester-dropdown"
          >
            {semesterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      
      <div className="action-buttons"> 
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={navigateSummary}>Generate Summary</button>
        <button onClick={navigateProfessional}>Professional Electives</button>
        <button onClick={navigateWordPage}>Downloadable Word Format</button>
      </div>
    </div>


      {/* Filtered Results Table */}
        {tableData.length > 0 && (
          <div className="filtered-results-container">
          </div>
        )}
            </div>
  );
}


export default CourseMe;