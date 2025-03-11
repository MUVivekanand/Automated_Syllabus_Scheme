// import React, { useState } from "react";
// import "../styles/SemInfo.css";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// function SemInfo() {
//   const [semData, setSemData] = useState(
//     Array.from({ length: 8 }, (_, i) => ({
//       sem_no: i + 1,
//       theory_courses: "",
//       practical_courses: "",
//     }))
//   );
//   const [totalCredits, setTotalCredits] = useState(""); 
//   const navigate = useNavigate();

//   const handleInputChange = (index, field, value) => {
//     const updatedData = [...semData];
//     updatedData[index] = { ...updatedData[index], [field]: value };
//     setSemData(updatedData);
//   };

//   const handleTotalCreditsChange = (e) => {
//     setTotalCredits(e.target.value);
//   };

//   const handleSubmit = async () => {
//   try {
//     // Filter out rows with empty fields and only send valid data
//     const filteredSemData = semData.filter(row => 
//       row.theory_courses.trim() !== "" || row.practical_courses.trim() !== ""
//     );

//     if (filteredSemData.length === 0) {
//       alert("No new data entered. Existing data remains unchanged.");
//       navigate("/syllabus");
//       return;
//     }

//     const semInfoPayload = filteredSemData.map(row => ({
//       sem_no: row.sem_no,
//       theory_courses: row.theory_courses.trim() || null,
//       practical_courses: row.practical_courses.trim() || null,
//       total_credits: totalCredits || null,
//     }));

//     // Calculate serial numbers and prepare credits payload
//     let serialNo = 1;
//     const creditsPayload = filteredSemData.flatMap(semester => {
//       const theoryRows = Array.from({ length: parseInt(semester.theory_courses) || 0 }, () => ({
//         sem_no: semester.sem_no,
//         category: "theory",
//         serial_no: serialNo++, // Assign and increment serial number
//       }));

//       const practicalRows = Array.from({ length: parseInt(semester.practical_courses) || 0 }, () => ({
//         sem_no: semester.sem_no,
//         category: "practical",
//         serial_no: serialNo++, // Assign and increment serial number
//       }));

//       return [...theoryRows, ...practicalRows];
//     });

//     // API calls
//     const semInfoResponse = await axios.post("http://localhost:4000/api/updateSemInfo", {
//       semData: semInfoPayload,
//     });

//     const creditsResponse = await axios.post("http://localhost:4000/api/updateCredits", {
//       creditsData: creditsPayload,
//     });

//     if (semInfoResponse.data.success && creditsResponse.data.success) {
//       alert("Semester information updated successfully.");
//       navigate("/syllabus");
//     } else {
//       alert("Failed to update semester information.");
//     }
//   } catch (error) {
//     console.error("Error updating semester info:", error);
//     alert("An error occurred while updating semester information.");
//   }  
  
// };

  
//   return (
//     <div className="container-seminfo">
//       <h1 className="page-title">Semester Information</h1>
//       <h3 className="subtitle">Add Total Courses for Each Semester</h3>

//       <div className="table-container">
//         <table className="data-table">
//           <thead>
//             <tr>
//               <th>Semester No</th>
//               <th>Theory Courses</th>
//               <th>Practical Courses</th>
//             </tr>
//           </thead>
//           <tbody>
//             {semData.map((row, index) => (
//               <tr key={index}>
//                 <td>{row.sem_no}</td>
//                 <td>
//                   <input
//                     type="number"
//                     name="theoryCourses"
//                     placeholder="Enter theory courses"
//                     value={row.theory_courses}
//                     onChange={(e) =>
//                       handleInputChange(index, "theory_courses", e.target.value)
//                     }
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="number"
//                     name="practicalCourses"
//                     placeholder="Enter practical courses"
//                     value={row.practical_courses}
//                     onChange={(e) =>
//                       handleInputChange(index, "practical_courses", e.target.value)
//                     }
//                   />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="total-credits-container">
//         <label htmlFor="totalCredits">Total Credits:</label>
//         <input
//           type="number"
//           id="totalCredits"
//           placeholder="Enter total credits"
//           value={totalCredits}
//           onChange={handleTotalCreditsChange}
//         />
//       </div>

//       <button onClick={handleSubmit} className="submit-button">
//         Submit
//       </button>
//     </div>
//   );
// }

// export default SemInfo;




import React, { useState, useEffect } from "react";
import "../styles/SemInfo.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SemInfo() {
  const [semData, setSemData] = useState([]);
  const [totalCredits, setTotalCredits] = useState("");
  const navigate = useNavigate();
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingData, setExistingData] = useState(null);

  // Initialize semester data based on degree
  useEffect(() => {
    if (degree === "B.E") {
      setSemData(
        Array.from({ length: 8 }, (_, i) => ({
          sem_no: i + 1,
          theory_courses: "",
          practical_courses: "",
          mandatory_courses: "",
        }))
      );
    } else if (degree === "M.E") {
      // Only 4 semesters for M.E
      setSemData(
        Array.from({ length: 4 }, (_, i) => ({
          sem_no: i + 1,
          theory_courses: "",
          practical_courses: "",
          mandatory_courses: "",
        }))
      );
      // Force department to CSE for M.E
      setDepartment("CSE");
    } else {
      setSemData([]);
    }
    
    // Clear existing data when degree changes
    setExistingData(null);
    setTotalCredits("");
  }, [degree]);

  // Handle degree change
  const handleDegreeChange = (e) => {
    const selectedDegree = e.target.value;
    setDegree(selectedDegree);
    // Reset department if changing to M.E
    if (selectedDegree === "M.E") {
      setDepartment("CSE");
    } else {
      setDepartment("");
    }
  };

  // Fetch existing data when degree and department are selected
  useEffect(() => {
    if (degree && department) {
      fetchExistingData();
    }
  }, [degree, department]);

  const fetchExistingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:4000/api/seminfo/getSemInfo?degree=${degree}&department=${department}`
      );
  
      // Generate default semester data based on degree
      const defaultSemData =
        degree === "B.E"
          ? Array.from({ length: 8 }, (_, i) => ({
              sem_no: i + 1,
              theory_courses: "",
              practical_courses: "",
              mandatory_courses: "",
            }))
          : Array.from({ length: 4 }, (_, i) => ({
              sem_no: i + 1,
              theory_courses: "",
              practical_courses: "",
              mandatory_courses: "",
            }));
  
      if (response.data.success && response.data.data.length > 0) {
        const fetchedData = response.data.data;
  
        // Update totalCredits with the first non-null value found
        const foundItem = fetchedData.find((item) => item.total_credits);
        const creditsValue = foundItem ? foundItem.total_credits : "";
        setTotalCredits(creditsValue);

        // Store the existing data for comparison
        setExistingData(fetchedData);
  
        // Update defaultSemData with fetched values (match by sem_no)
        const updatedSemData = [...defaultSemData];
        fetchedData.forEach((item) => {
          const index = updatedSemData.findIndex(
            (row) => row.sem_no === item.sem_no
          );
          if (index !== -1) {
            updatedSemData[index] = {
              ...updatedSemData[index],
              theory_courses: item.theory_courses || "",
              practical_courses: item.practical_courses || "",
              mandatory_courses: item.mandatory_courses || "",
            };
          }
        });
        setSemData(updatedSemData);
      } else {
        // If no data, use the default array
        setSemData(defaultSemData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching semester info:", error);
      setLoading(false);
    }
  };
  

  const handleInputChange = (index, field, value) => {
    const updatedData = [...semData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setSemData(updatedData);
  };

  const navigateRegulations = () => {
    navigate(`/Regulations?degree=${degree}&department=${department}`);
  };  

  const handleTotalCreditsChange = (e) => {
    setTotalCredits(e.target.value);
  };

  const hasDataChanged = () => {
    if (!existingData) return true;
    
    // Create a map of existing data for easy comparison
    const existingMap = {};
    existingData.forEach(item => {
      existingMap[item.sem_no] = item;
    });
    
    // Check if any data has changed
    for (const row of semData) {
      const existing = existingMap[row.sem_no];
      if (!existing) {
        if (row.theory_courses || row.practical_courses || row.mandatory_courses) {
          return true;
        }
      } else if (
        row.theory_courses !== (existing.theory_courses || "") ||
        row.practical_courses !== (existing.practical_courses || "") ||
        row.mandatory_courses !== (existing.mandatory_courses || "")
      ) {
        return true;
      }
    }
    
    // Check if total credits changed
    if (totalCredits !== (existingData.find(item => item.total_credits)?.total_credits || "")) {
      return true;
    }
    
    return false;
  };

  const handleSubmit = async () => {
    try {
        // Validate degree and department are selected
        if (!degree || !department) {
            alert("Please select both Degree and Department before submitting.");
            return;
        }

        // Check if data has changed
        if (!hasDataChanged()) {
            alert("No changes detected. Existing data remains unchanged.");
            navigate("/syllabus");
            return;
        }

        // Filter out rows with empty fields (Convert numbers to strings before trimming)
        const filteredSemData = semData.filter(
            (row) =>
                String(row.theory_courses).trim() !== "" ||
                String(row.practical_courses).trim() !== "" ||
                String(row.mandatory_courses).trim() !== ""
        );

        if (filteredSemData.length === 0) {
            alert("No data entered. Existing data remains unchanged.");
            navigate("/syllabus");
            return;
        }

        const semInfoPayload = filteredSemData.map((row) => ({
            sem_no: row.sem_no,
            theory_courses: row.theory_courses ?? null,   // Ensure numbers are handled correctly
            practical_courses: row.practical_courses ?? null,
            mandatory_courses: row.mandatory_courses ?? null,
            total_credits: totalCredits || null,
            degree: degree,
            department: department,
        }));

        // Identify new entries only
        const newEntriesOnly = filteredSemData.filter((semester) => {
            if (!existingData) return true;

            const existing = existingData.find(item => item.sem_no === semester.sem_no);
            if (!existing) return true;

            if (
                existing.theory_courses !== semester.theory_courses ||
                existing.practical_courses !== semester.practical_courses ||
                existing.mandatory_courses !== semester.mandatory_courses
            ) {
                return true;
            }

            return false;
        });

        // Only create credits for new entries
        const creditsPayload = newEntriesOnly.map((semester) => ({
            sem_no: semester.sem_no,
            theory_courses: semester.theory_courses ?? 0,
            practical_courses: semester.practical_courses ?? 0,
            mandatory_courses: semester.mandatory_courses ?? 0,
            degree: degree,
            department: department,
            createOnly: true
        }));

        // API calls
        const semInfoResponse = await axios.post(
            "http://localhost:4000/api/seminfo/updateSemInfo",
            { semData: semInfoPayload }
        );

        // Only update credits if there are new entries
        // if (creditsPayload.length > 0) {
        //     const creditsResponse = await axios.post(
        //         "http://localhost:4000/api/seminfo/updateCredits",
        //         { creditsData: creditsPayload }
        //     );

        //     if (!creditsResponse.data.success) {
        //         alert("Warning: Failed to update some course placeholders.");
        //     }
        // }

        if (semInfoResponse.data.success) {
            alert("Semester information updated successfully.");
            navigate("/syllabus");
        } else {
            alert("Failed to update semester information.");
        }
    } catch (error) {
        console.error("Error updating semester info:", error);
        alert("An error occurred while updating semester information.");
    }
};

  return (
    <div className="container-seminfo">
      <h1 className="page-title">Semester Information</h1>
      <div className="dropdown-container">
        <div>
          <label>Degree: </label>
          <select value={degree} onChange={handleDegreeChange}>
            <option value="">Select Degree</option>
            <option value="B.E">B.E</option>
            <option value="M.E">M.E</option>
          </select>
        </div>

        <div>
          <label>Department: </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={degree === "M.E"} // Disable for M.E since only CSE is allowed
          >
            <option value="">Select Department</option>
            <option value="CSE">CSE</option>
            {degree === "B.E" && (
              <>
                <option value="CSE AI-ML">CSE AI-ML</option>
                <option value="IT">IT</option>
              </>
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading existing data...</div>
      ) : (
        <>
          <h3 className="subtitle">Add Total Courses for Each Semester</h3>

          <div className="table-container-sem">
            <table className="data-table-sem">
              <thead>
                <tr>
                  <th>Semester No</th>
                  <th>Theory Courses</th>
                  <th>Practical Courses</th>
                  <th>Mandatory Courses</th>
                </tr>
              </thead>
              <tbody>
                {semData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.sem_no}</td>
                    <td>
                      <input
                        type="number"
                        name="theoryCourses"
                        className="input-sem"
                        placeholder="Enter theory courses"
                        value={row.theory_courses}
                        onChange={(e) =>
                          handleInputChange(index, "theory_courses", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="practicalCourses"
                        className="input-sem"
                        placeholder="Enter practical courses"
                        value={row.practical_courses}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "practical_courses",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="mandatoryCourses"
                        className="input-sem"
                        placeholder="Enter mandatory courses"
                        value={row.mandatory_courses}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "mandatory_courses",
                            e.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="total-credits-container">
            <label htmlFor="totalCredits">Total Credits:</label>
            <input
              type="number"
              id="totalCredits"
              placeholder="Enter total credits"
              value={totalCredits}
              onChange={handleTotalCreditsChange}
            />
          </div>

          <button onClick={handleSubmit} className="submit-button">
            Submit
          </button>
          <button onClick={navigateRegulations} className="submit-button">
            New Regulations
          </button>
        </>
      )}
    </div>
  );
}

export default SemInfo;