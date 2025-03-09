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




import React, { useState } from "react";
import "../styles/SemInfo.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SemInfo() {
  const [semData, setSemData] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      sem_no: i + 1,
      theory_courses: "",
      practical_courses: "",
      mandatory_courses: "",
    }))
  );
  const [totalCredits, setTotalCredits] = useState("");
  const navigate = useNavigate();
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");

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

  const handleSubmit = async () => {
    try {
      // Validate degree and department are selected
      if (!degree || !department) {
        alert("Please select both Degree and Department before submitting.");
        return;
      }

      // Filter out rows with empty fields
      const filteredSemData = semData.filter(
        (row) =>
          row.theory_courses.trim() !== "" ||
          row.practical_courses.trim() !== "" ||
          row.mandatory_courses.trim() !== ""
      );

      if (filteredSemData.length === 0) {
        alert("No new data entered. Existing data remains unchanged.");
        navigate("/syllabus");
        return;
      }

      const semInfoPayload = filteredSemData.map((row) => ({
        sem_no: row.sem_no,
        theory_courses: row.theory_courses.trim() || null,
        practical_courses: row.practical_courses.trim() || null,
        mandatory_courses: row.mandatory_courses.trim() || null,
        total_credits: totalCredits || null,
        degree: degree,
        department: department,
      }));

      // Calculate serial numbers and prepare credits payload
      const creditsPayload = filteredSemData.map((semester) => ({
        sem_no: semester.sem_no,
        theory_courses: semester.theory_courses.trim() || "0",
        practical_courses: semester.practical_courses.trim() || "0",
        mandatory_courses: semester.mandatory_courses.trim() || "0",
        degree: degree,
        department: department,
      }));

      // API calls
      const semInfoResponse = await axios.post(
        "http://localhost:4000/api/seminfo/updateSemInfo",
        {
          semData: semInfoPayload,
        }
      );

      const creditsResponse = await axios.post(
        "http://localhost:4000/api/seminfo/updateCredits",
        {
          creditsData: creditsPayload,
        }
      );

      if (semInfoResponse.data.success && creditsResponse.data.success) {
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
          <select value={degree} onChange={(e) => setDegree(e.target.value)}>
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
          >
            <option value="">Select Department</option>
            <option value="CSE">CSE</option>
            <option value="CSE AI-ML">CSE AI-ML</option>
            <option value="IT">IT</option>
          </select>
        </div>
      </div>

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
    </div>
  );
}

export default SemInfo;