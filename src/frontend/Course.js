import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../styles/Course.css";
import { useNavigate } from "react-router-dom";

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
  const [filterForm, setFilterForm] = useState({
    filterSem: "",
    FilterDep: "",
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [tableData, setTableData] = useState([]);

  const navigate = useNavigate();

  const navigateSummary = () => {
    navigate("/Summary");
  };

  const navigateRegulations = () => {
    navigate("/Regulations");
  };

  // const fetchData = async () => {
  //   try {
  //     // Reset existing states
  //     setCourses([]);
  //     setExistingCourses([]);
  //     setTotalRow({ lecture: 0, tutorial: 0, practical: 0, credits: 0 });
  
  //     // Fetch semester info first
  //     const semResponse = await axios.get(`http://localhost:4000/api/course/seminfo/${currentSem}`);
  //     const semInfo = semResponse.data;
  
  //     // Fetch existing courses for this semester
  //     const coursesResponse = await axios.get(`http://localhost:4000/api/course/courses/${currentSem}`);
  //     const existingCoursesData = coursesResponse.data;
  
  //     // Determine starting serial number based on the last existing course
  //     let lastSerialNo = 0;
  //     if (existingCoursesData.length > 0) {
  //       lastSerialNo = Math.max(...existingCoursesData.map(course => course.serial_no), 0);
  //     }
  
  //     // Function to generate serial numbers dynamically if no existing data
  //     const generateSerialNumbers = (count, category) => {
  //       return Array.from({ length: count }, () => ({
  //         sem_no: currentSem,
  //         serial_no: ++lastSerialNo, // Incrementing serial number
  //         courseCode: '',
  //         courseTitle: '',
  //         lecture: 0,
  //         tutorial: 0,
  //         practical: 0,
  //         credits: 0,
  //         type: '',
  //         faculty: '',
  //         courseType: category
  //       }));
  //     };
  
  //     let generatedCourses = [];
  //     if (existingCoursesData.length === 0) {
  //       // No existing courses, generate serial numbers dynamically
  //       generatedCourses = [
  //         ...generateSerialNumbers(semInfo.theory_courses, 'theory'),
  //         ...generateSerialNumbers(semInfo.practical_courses, 'practical'),
  //         ...generateSerialNumbers(semInfo.mandatory_courses, 'mandatory')
  //       ];
  //     } else {
  //       // Use existing courses data with serial numbers from the database
  //       generatedCourses = existingCoursesData.map(course => ({
  //         serial_no: course.serial_no,
  //         courseCode: course.course_code,
  //         courseTitle: course.course_name,
  //         lecture: course.lecture,
  //         tutorial: course.tutorial,
  //         practical: course.practical,
  //         credits: course.credits,
  //         type: course.type,
  //         faculty: course.faculty,
  //         courseType: course.category
  //       }));
  //     }
  
  //     // Update state with the new course data
  //     setCourses(generatedCourses);
  //     setExistingCourses(existingCoursesData);
  
  //     // Update common info
  //     setCommonInfo(prev => ({
  //       ...prev,
  //       practicalCourses: semInfo.practical_courses,
  //       theoryCourses: semInfo.theory_courses,
  //       mandatoryCourses: semInfo.mandatory_courses || 0,
  //       semNo: currentSem
  //     }));
  
  //     // Calculate total row
  //     const totals = generatedCourses.reduce(
  //       (acc, course) => ({
  //         lecture: acc.lecture + Number(course.lecture || 0),
  //         tutorial: acc.tutorial + Number(course.tutorial || 0),
  //         practical: acc.practical + Number(course.practical || 0),
  //         credits: acc.credits + Number(course.credits || 0),
  //       }),
  //       { lecture: 0, tutorial: 0, practical: 0, credits: 0 }
  //     );
  //     setTotalRow(totals);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //     setCourses([]);
  //     setExistingCourses([]);
  //     setTotalRow({ lecture: 0, tutorial: 0, practical: 0, credits: 0 });
  //   }
  // };
  
  
  


  // // Helper function to merge existing courses with empty rows
  // const mergeExistingCourses = (emptyRows, existingCourses, courseType) => {
  //   // Filter existing courses by the specific course type
  //   const filteredCourses = existingCourses.filter(
  //     course => course.category.toLowerCase() === courseType
  //   );
  
  //   return emptyRows.map((emptyRow, index) => {
  //     const matchingCourse = filteredCourses[index];
      
  //     return matchingCourse ? {
  //       ...emptyRow,
  //       courseCode: matchingCourse.course_code,
  //       courseTitle: matchingCourse.course_name,
  //       lecture: matchingCourse.lecture,
  //       tutorial: matchingCourse.tutorial,
  //       practical: matchingCourse.practical,
  //       credits: matchingCourse.credits,
  //       type: matchingCourse.type,
  //       faculty: matchingCourse.faculty
  //     } : emptyRow;
  //   });
  // };


  // // Initial data fetch
  // useEffect(() => {
  //   fetchData();
  //   fetchTableData();
  // }, [currentSem]);

  const fetchData = async () => {
    try {
      setCourses([]);
      setExistingCourses([]);
      setTotalRow({ lecture: 0, tutorial: 0, practical: 0, credits: 0 });

      // Fetch semester info
      const semResponse = await axios.get(`http://localhost:4000/api/course/seminfo/${currentSem}`);
      const semInfo = semResponse.data;

      // Create empty course templates
      const createEmptyRows = (count, category) => {
        return Array.from({ length: count }, () => ({
          serial_no: "",
          courseCode: "",
          courseTitle: "",
          lecture: 0,
          tutorial: 0,
          practical: 0,
          credits: 0,
          type: "",
          faculty: "",
          courseType: category
        }));
      };

      // Generate empty rows based on semInfo
      const emptyRows = {
        theory: createEmptyRows(semInfo.theory_courses, "theory"),
        practical: createEmptyRows(semInfo.practical_courses, "practical"),
        mandatory: createEmptyRows(semInfo.mandatory_courses || 0, "mandatory")
      };

      // Fetch existing courses
      const coursesResponse = await axios.get(`http://localhost:4000/api/course/courses/${currentSem}`);
      const existingCoursesData = coursesResponse.data;

      // Sort and organize existing courses by category
      const organizedCourses = {
        theory: [],
        practical: [],
        mandatory: []
      };

      existingCoursesData.forEach(course => {
        if (organizedCourses[course.category.toLowerCase()]) {
          organizedCourses[course.category.toLowerCase()].push({
            serial_no: course.serial_no,
            courseCode: course.course_code,
            courseTitle: course.course_name,
            lecture: course.lecture,
            tutorial: course.tutorial,
            practical: course.practical,
            credits: course.credits,
            type: course.type,
            faculty: course.faculty,
            courseType: course.category.toLowerCase()
          });
        }
      });

      // Sort each category by serial number
      Object.keys(organizedCourses).forEach(category => {
        organizedCourses[category].sort((a, b) => a.serial_no - b.serial_no);
      });

      // Merge existing courses with empty rows
      const mergedCourses = Object.keys(emptyRows).flatMap(category => {
        const existing = organizedCourses[category];
        const empty = emptyRows[category];
        return existing.concat(empty.slice(existing.length));
      });

      setCourses(mergedCourses);
      setExistingCourses(existingCoursesData);
      updateCommonInfo(semInfo);
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
      semNo: currentSem
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

  useEffect(() => {
    fetchData();
  }, [currentSem]);

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
      const response = await axios.get('http://localhost:4000/api/course/getTableData');
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

  // Submit handler
  // const handleSubmit = useCallback(async () => {
  //   try {
  //     // Map the serial_no to update the existing rows
  //     for (const course of courses) {
  //       await axios.patch(`http://localhost:4000/api/course/credits/${course.serial_no}`, {
  //         course_code: course.courseCode,
  //         course_name: course.courseTitle,
  //         lecture: course.lecture,
  //         tutorial: course.tutorial,
  //         practical: course.practical,
  //         credits: course.credits,
  //         ca_marks: commonInfo.caMarks,
  //         fe_marks: commonInfo.feMarks,
  //         total_marks: commonInfo.totalMarks,
  //         type: course.type,
  //         faculty: course.faculty,
  //         department: commonInfo.department,
  //         sem_no: currentSem, // Added semester number
  //       });
  //     }
  //     alert("Data updated successfully!");
  //     // Refresh data after submission
  //     fetchData();
  //   } catch (error) {
  //     console.error("Error updating data:", error);
  //     alert("Failed to update data.");
  //   }
  // }, [courses, commonInfo, currentSem]);

  const handleSubmit = useCallback(async () => {
    try {
      for (const course of courses) {
        if (course.courseCode && course.serial_no) {
          await axios.patch(`http://localhost:4000/api/course/credits/${course.courseCode}`, {
            serial_no: course.serial_no,
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
            sem_no: currentSem,
            category: course.courseType
          });
        }
      }
      alert("Data updated successfully!");
      fetchData();
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Failed to update data.");
    }
  }, [courses, commonInfo, currentSem]);


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

  // Rest of the component remains the same as in the original code...

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
            <label>Total Mandatory:</label>
            <input type="number" value={commonInfo.mandatoryCourses} readOnly />
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
        <h2>Course Details</h2>

        {/* Theory Courses Section */}
        <h4>Theory Courses</h4>
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
            {courses
              .filter((course) => course.courseType === "theory")
              .map((course, index) => (
                <tr key={`theory-${index}`}>
                  <td>
                      <input
                        type="number"
                        value={course.serial_no || ""}
                        onChange={(e) => handleCourseChange(courses.findIndex((c) => c === course), "serial_no", e.target.value)}
                      />
                    </td>

                  {Object.keys(course)
                    .filter((key) => key !== "courseType" && key !== "serial_no")
                    .map((field) => (
                      <td key={field}>
                        {field === "credits" ? (
                          <span>{course[field]}</span>
                        ) : (
                          <input
                            type={["lecture", "tutorial", "practical"].includes(field) ? "number" : "text"}
                            value={course[field]}
                            onChange={(e) => handleCourseChange(courses.findIndex((c) => c === course), field, e.target.value)}
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
            {courses
              .filter((course) => course.courseType === "practical")
              .map((course, index) => (
                <tr key={`practical-${index}`}>
                  <td>
                      <input
                        type="number"
                        value={course.serial_no || ""}
                        onChange={(e) => handleCourseChange(courses.findIndex((c) => c === course), "serial_no", e.target.value)}
                      />
                    </td>

                  {Object.keys(course)
                    .filter((key) => key !== "courseType" && key !== "serial_no")
                    .map((field) => (
                      <td key={field}>
                        {field === "credits" ? (
                          <span>{course[field]}</span>
                        ) : (
                          <input
                            type={["lecture", "tutorial", "practical"].includes(field) ? "number" : "text"}
                            value={course[field]}
                            onChange={(e) => handleCourseChange(courses.findIndex((c) => c === course), field, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
                </tr>
              ))}
          </tbody>
        </table>

        {/* Mandatory Courses Section */}
        {/* <h4>Mandatory Courses</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th className="sno-column">Serial No</th>
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
              .filter((course) => course.courseType === "mandatory")
              .map((course, index) => (
                <tr key={`mandatory-${index}`}>
                  <td>
                    <input
                      type="number"
                      value={course.serial_no || ""}
                      onChange={(e) => handleCourseChange(courses.findIndex((c) => c === course), "serial_no", e.target.value)}
                    />
                  </td>

                  {Object.keys(course)
                    .filter((key) => key !== "courseType" && key !== "serial_no")
                    .map((field) => (
                      <td key={field}>
                        {field === "credits" ? (
                          <span>{course[field]}</span>
                        ) : (
                          <input
                            type={["lecture", "tutorial", "practical"].includes(field) ? "number" : "text"}
                            value={course[field]}
                            onChange={(e) => handleCourseChange(courses.findIndex((c) => c === course), field, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
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
        </table> */}

<h4>Mandatory Courses</h4>
<table className="data-table">
  <thead>
    <tr>
      <th className="sno-column">Serial No</th>
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
      .filter((course) => course.courseType === "mandatory")
      .map((course, index) => (
        <tr key={`mandatory-${index}`}>
          <td>
            <input
              type="number"
              value={course.serial_no || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "serial_no", e.target.value)
              }
            />
          </td>
          <td>
            <input
              type="text"
              value={course.courseCode || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "courseCode", e.target.value)
              }
            />
          </td>
          <td>
            <input
              type="text"
              value={course.courseTitle || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "courseTitle", e.target.value)
              }
            />
          </td>
          <td>
            <input
              type="number"
              value={course.lecture || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "lecture", e.target.value)
              }
            />
          </td>
          <td>
            <input
              type="number"
              value={course.tutorial || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "tutorial", e.target.value)
              }
            />
          </td>
          <td>
            <input
              type="number"
              value={course.practical || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "practical", e.target.value)
              }
            />
          </td>
          <td>
            <input
              type="number"
              value={course.credits || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "credits", e.target.value)
              }
            />
          </td>
          <td>
            <input
              type="text"
              value={course.type || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "type", e.target.value)
              }
            />
          </td>
          <td>
            <input
              type="text"
              value={course.faculty || ""}
              onChange={(e) =>
                handleCourseChange(courses.findIndex((c) => c === course), "faculty", e.target.value)
              }
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
          
          {/* Theory Courses */}
          <h4>Theory Courses</h4>
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
              {existingCourses
                .filter((course) => course.category.toLowerCase().includes("theory"))
                .map((course, index) => (
                  <tr key={`theory-${index}`}>
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

          {/* Practical Courses */}
          <h4>Practical Courses</h4>
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
              {existingCourses
                .filter((course) => course.category.toLowerCase().includes("practical"))
                .map((course, index) => (
                  <tr key={`practical-${index}`}>
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

          {/* Mandatory Courses */}
          <h4>Mandatory Courses</h4>
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
              {existingCourses
                .filter((course) => course.category.toLowerCase().includes("mandatory"))
                .map((course, index) => (
                  <tr key={`mandatory-${index}`}>
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

      {/* Action Buttons */}
      <div className="actions">
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={handleNext} disabled={currentSem >= 8}>Next Semester</button>
        <button onClick={handleBack} disabled={currentSem <= 1}>Back to Previous Semester</button>
        <button onClick={navigateSummary}>Generate Summary</button>
        <button onClick={navigateRegulations}>New Regulations</button>
      </div>



      {/* Filtered Results Table */}
{tableData.length > 0 && (
  <div className="filtered-results-container">
  </div>
)}
    </div>
  );
}

export default Course;















































