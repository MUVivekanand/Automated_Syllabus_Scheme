import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../styles/Course.css";
import {useNavigate} from "react-router-dom";

function Course() {
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
  });
  const [courses, setCourses] = useState([]);
  const [existingCourses, setExistingCourses] = useState([]);
  const [totalRow, setTotalRow] = useState({
    lecture: 0,
    tutorial: 0,
    practical: 0,
    credits: 0,
  });

  const navigate=useNavigate();

  const navigateSummary=() => {
    navigate("/Summary");
  }

  //Fetch data when semester changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const semResponse = await axios.get(`http://localhost:4000/api/seminfo/${currentSem}`);
        const semInfo = semResponse.data;

        setCommonInfo(prev => ({
          ...prev,
          practicalCourses: semInfo.practical_courses,
          theoryCourses: semInfo.theory_courses,
          semNo: currentSem
        }));
  
        // Fetch courses for the current semester
        const coursesResponse = await axios.get(`http://localhost:4000/api/courses/${currentSem}`);
        const existingCoursesData = coursesResponse.data;
  
        if (existingCoursesData.length > 0) {
          const formattedCourses = existingCoursesData.map((course) => ({
            serial_no:course.serial_no,
            courseCode: course.course_code,
            courseTitle: course.course_name,
            lecture: course.lecture || 0,
            tutorial: course.tutorial || 0,
            practical: course.practical || 0,
            credits: course.credits || 0,
            type: course.type || "",
            faculty: course.faculty || "",
            courseType: course.category, 
          }));
  
          setCourses(formattedCourses);

          // const totals = formattedCourses.reduce(
          //   (acc, course) => ({
          //     lecture: acc.lecture + Number(course.lecture || 0),
          //     tutorial: acc.tutorial + Number(course.tutorial || 0),
          //     practical: acc.practical + Number(course.practical || 0),
          //     credits: acc.credits + Number(course.credits || 0),
          //   }),
          //   { lecture: 0, tutorial: 0, practical: 0, credits: 0 }
          // );
          // setTotalRow(totals);
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


  const handleSubmit = useCallback(async () => {
    try {
      // Map the serial_no to update the existing rows
      for (const course of courses) {
        await axios.patch(`http://localhost:4000/api/credits/${course.serial_no}`, {
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
        });
      }
      alert("Data updated successfully!");
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Failed to update data.");
    }
  }, [courses, commonInfo]);

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
          <label>Total Theory:</label>
          <input type="number" value={commonInfo.theoryCourses} readOnly />
        </div>
        <div>
          <label>Total Practical:</label>
          <input type="number" value={commonInfo.practicalCourses} readOnly />
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

        {/* Theory Courses Section */}
        <h4>Theory Courses</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Serial No</th> {/* Add Serial No column */}
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
            {courses
              .filter((course) => course.courseType === "theory")
              .map((course, index) => (
                <tr key={`theory-${index}`}>
                  <td>{course.serial_no}</td> {/* Add Serial No data */}
                  {Object.keys(course)
                    .filter((key) => key !== "courseType" && key !== "serial_no")
                    .map((field) => (
                      <td key={field}>
                        {field === "credits" ? (
                          <span>{course[field]}</span>
                        ) : (
                          <input
                            type={
                              ["lecture", "tutorial", "practical"].includes(field)
                                ? "number"
                                : "text"
                            }
                            value={course[field]}
                            onChange={(e) =>
                              handleCourseChange(
                                courses.findIndex((c) => c === course),
                                field,
                                e.target.value
                              )
                            }
                          />
                        )}
                      </td>
                    ))}
                </tr>
              ))}
          </tbody>
        </table>

        {/* Practical Courses Section */}
        <h4>Practical Courses</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Serial No</th> {/* Add Serial No column */}
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
            {courses
              .filter((course) => course.courseType === "practical")
              .map((course, index) => (
                <tr key={`practical-${index}`}>
                  <td>{course.serial_no}</td> {/* Add Serial No data */}
                  {Object.keys(course)
                    .filter((key) => key !== "courseType" && key !== "serial_no")
                    .map((field) => (
                      <td key={field}>
                        {field === "credits" ? (
                          <span>{course[field]}</span>
                        ) : (
                          <input
                            type={
                              ["lecture", "tutorial", "practical"].includes(field)
                                ? "number"
                                : "text"
                            }
                            value={course[field]}
                            onChange={(e) =>
                              handleCourseChange(
                                courses.findIndex((c) => c === course),
                                field,
                                e.target.value
                              )
                            }
                          />
                        )}
                      </td>
                    ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Total Row */}
      <table className="data-table">
        <tbody>
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
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {/* Action Buttons */}
    <div className="actions">
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={handleNext} disabled={currentSem >= 8}>
        Next Semester
      </button>
      <button onClick={handleBack} disabled={currentSem <= 1}>
        Back to Previous Semester
      </button>
      <button onClick={navigateSummary} disabled={currentSem <= 1}>
        Generate Summary
      </button>
    </div>

    {/* Filter Section */}
    <br />
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

    {/* Filtered Results Table */}
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