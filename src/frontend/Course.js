import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../styles/Course.css";

function Course() {
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
  const [existingCourses, setExistingCourses] = useState([]);
  const [totalRow, setTotalRow] = useState({
    lecture: 0,
    tutorial: 0,
    practical: 0,
    credits: 0,
  });


  // Fetch data when semester changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch semester info
        const semResponse = await axios.get(`http://localhost:4000/api/seminfo/${currentSem}`);
        const semInfo = semResponse.data;

        // Fetch existing courses
        const coursesResponse = await axios.get(`http://localhost:4000/api/courses/${currentSem}`);
        const existingCoursesData = coursesResponse.data;
        setExistingCourses(existingCoursesData);

        // Update common info
        setCommonInfo(prev => ({
          ...prev,
          totalCredits: semInfo.total_credits,
          totalCourses: semInfo.total_courses,
          semNo: currentSem
        }));

        // Initialize courses
        if (existingCoursesData.length > 0) {
          // Use existing data if available
          const formattedCourses = existingCoursesData.map(course => ({
            courseCode: course.course_code,
            courseTitle: course.course_name,
            lecture: course.lecture,
            tutorial: course.tutorial,
            practical: course.practical,
            credits: course.credits,
            type: course.type,
            faculty: course.faculty,
          }));
          
          setCourses(formattedCourses);
          
          // Update total row with existing data
          const totals = formattedCourses.reduce(
            (acc, course) => ({
              lecture: acc.lecture + Number(course.lecture || 0),
              tutorial: acc.tutorial + Number(course.tutorial || 0),
              practical: acc.practical + Number(course.practical || 0),
              credits: acc.credits + Number(course.credits || 0),
            }),
            { lecture: 0, tutorial: 0, practical: 0, credits: 0 }
          );
          setTotalRow(totals);
        } else {
          // Create empty rows if no existing data
          setCourses(
            Array.from({ length: semInfo.total_courses }, () => ({
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
          setTotalRow({
            lecture: 0,
            tutorial: 0,
            practical: 0,
            credits: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [currentSem]);

  // Handle common info changes
  const handleCommonInfoChange = useCallback((e) => {
    const { name, value } = e.target;
    setCommonInfo(prev => ({ ...prev, [name]: value }));
  }, []);

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
  
  const handleCourseChange = useCallback((index, field, value) => {
    setCourses(prevCourses => {
      const updatedCourses = [...prevCourses];
      updatedCourses[index] = {
        ...updatedCourses[index],
        [field]: value,
      };
    
      // Calculate credits
      const lecture = Number(updatedCourses[index].lecture || 0);
      const tutorial = Number(updatedCourses[index].tutorial || 0);
      const practical = Number(updatedCourses[index].practical || 0);
      updatedCourses[index].credits = calculateCredits(lecture, tutorial, practical);
    
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
    
      setTotalRow(totals);
      return updatedCourses;
    });
  }, []);
  
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const isValid = courses.every(course => course.courseCode);
  
    if (!isValid) {
      alert("Please fill in the Course Code for all courses before submitting!");
      return;
    }

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
      credits: course.credits, // Use dynamically calculated credits
      ca_marks: commonInfo.caMarks,
      fe_marks: commonInfo.feMarks,
      total_marks: commonInfo.totalMarks,
      type: course.type,
      faculty: course.faculty,
      department: commonInfo.department,
    }));
  
    try {
      await axios.post("http://localhost:4000/api/credits", { totalCredits: totalRow.credits });
      await axios.delete(`http://localhost:4000/api/courses/${currentSem}`);
      await axios.post("http://localhost:4000/api/courses", semesterData);
      alert("Data submitted successfully!");
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Failed to submit data.");
    }
  }, [courses, currentSem, commonInfo, totalRow.credits]);
  

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentSem < 8) {
      setCurrentSem(prev => prev + 1);
      setCommonInfo(prev => ({
        ...prev,
        caMarks: "",
        feMarks: "",
        totalMarks: "",
        department: ""
      }));
    }
  }, [currentSem]);

  const handleBack = useCallback(() => {
    if (currentSem > 1) {
      setCurrentSem(prev => prev - 1);
      setCommonInfo(prev => ({
        ...prev,
        caMarks: "",
        feMarks: "",
        totalMarks: "",
        department: ""
      }));
    }
  }, [currentSem]);
  const [filterForm, setFilterForm] = useState({
    filterSem: "",
    FilterDep: "",
  });

  const [isFiltered, setIsFiltered] = useState(false);
  const [tableData, setTableData] = useState([]);

  // Add useEffect to fetch table data on component mount
  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      const response = await axios.get('http://localhost:4000/getTableData');
      if (response.data.success) {
        setTableData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filtertable = async () => {
    const filterData = {
      filterSem: Number(filterForm.filterSem),
      FilterDep: filterForm.FilterDep
    };

    try {
      const response = await axios.post('http://localhost:4000/filtertable', filterData);
      if (response.data.success) {
        setIsFiltered(true);
        await fetchTableData(); // Fetch updated data after applying filter
        alert("Filter applied successfully");
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert(`Failed to apply filter: ${error.response?.data?.error || error.message}`);
    }
  };

  const clearFilters = async () => {
    try {
      const response = await axios.post('http://localhost:4000/clearFilters');
      if (response.data.success) {
        setIsFiltered(false);
        setFilterForm({
          filterSem: "",
          FilterDep: "",
        });
        await fetchTableData(); // Fetch updated data after clearing filter
        alert("Filters cleared successfully");
      }
    } catch (error) {
      console.error('Error clearing filters:', error);
      alert('Failed to clear filters');
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

      {/* Course Details Input Section */}
      <div className="table-container">
          <h3>Course Details</h3>
          <table className="data-table">
            <thead>
              <tr>
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
                <tr key={index}>
                  {Object.keys(course).map((field) => (
                    <td key={field}>
                      {field === "credits" ? (
                        <span>{course[field]}</span>
                      ) : (
                        <input
                          type={
                            field === "lecture" ||
                            field === "tutorial" ||
                            field === "practical"
                              ? "number"
                              : "text"
                          }
                          value={course[field]}
                          onChange={(e) =>
                            handleCourseChange(index, field, e.target.value)
                          }
                          className={field === "courseTitle" ? "course-title-input" : ""}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="total-row">
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


      {/* Existing Courses Display Section */}
      {existingCourses.length > 0 && (
        <div className="existing-courses-container">
          <h3>Existing Courses for Semester {currentSem}</h3>
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
                <tr key={index}>
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
              <tr className="total-row">
                <td colSpan="2">Total</td>
                <td>{existingCourses.reduce((sum, course) => sum + course.lecture, 0)}</td>
                <td>{existingCourses.reduce((sum, course) => sum + course.tutorial, 0)}</td>
                <td>{existingCourses.reduce((sum, course) => sum + course.practical, 0)}</td>
                <td>{existingCourses.reduce((sum, course) => sum + course.credits, 0)}</td>
                <td>{existingCourses.reduce((sum, course) => sum + course.ca_marks, 0)}</td>
                <td>{existingCourses.reduce((sum, course) => sum + course.fe_marks, 0)}</td>
                <td>{existingCourses.reduce((sum, course) => sum + course.total_marks, 0)}</td>
                <td colSpan="4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="actions">
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={handleNext} disabled={currentSem >= 8}>
          Next Semester
        </button>
        <button onClick={handleBack} disabled={currentSem <= 1}>
          Back to Previous Semester
        </button>
      </div>

      <br></br>
      <div className="filter-container">
        <div className="form-part">
          <h4 className="part-title">Filter Details</h4>
          <div className="form-fields">
            <input
              type="number"
              name="filterSem"
              placeholder="Enter sem no"
              value={filterForm.filterSem}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="FilterDep"
              placeholder="Enter the department"
              value={filterForm.FilterDep}
              onChange={handleFilterChange}
            />
          </div>
          <button onClick={filtertable} className="generate-table-button">
            Apply filter
          </button>
          <button 
            onClick={clearFilters} 
            disabled={!isFiltered} 
            className="generate-table-button"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Add Filtered Results Table */}
      {tableData.length > 0 && (
        <div className="filtered-results-container">
          <h3>Filtered Results</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Lecture</th>
                <th>Tutorial</th>
                <th>Practical</th>
                <th>Credits</th>
                <th>CA Marks</th>
                <th>FE Marks</th>
                <th>Total Marks</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((course, index) => (
                <tr key={index}>
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
          </table>
        </div>
      )}
    </div>
  );
}

export default Course;