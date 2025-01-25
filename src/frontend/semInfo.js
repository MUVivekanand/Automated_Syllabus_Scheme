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
    }))
  );
  const [totalCredits, setTotalCredits] = useState(""); // Single input for total credits
  const navigate = useNavigate();

  // Handle input changes for each field
  const handleInputChange = (index, field, value) => {
    const updatedData = [...semData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setSemData(updatedData);
  };

  // Handle changes for total credits input
  const handleTotalCreditsChange = (e) => {
    setTotalCredits(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate inputs
      const isValidData = semData.every(row => 
        row.theory_courses !== "" && row.practical_courses !== ""
      );

      // if (!isValidData) {
      //   alert("Please fill in all theory and practical courses.");
      //   return;
      // }

      // if (!totalCredits) {
      //   alert("Please enter total credits.");
      //   return;
      // }

      const payload = {
        semData: semData,
        totalCredits: totalCredits
      };

      console.log("Payload sent to backend:", payload);
  
      const response = await axios.post("http://localhost:4000/updateSemInfo", payload);
      console.log("Backend response:", response.data);
  
      if (response.data.success) {
        alert("Semester information updated successfully.");
        navigate("/syllabus");
      } else {
        alert("Failed to update semester information.");
        console.log("Server response error:", response.data);
      }
    } catch (error) {
      console.error("Error updating semester info:", error);
      alert("An error occurred while updating semester information.");
      
      // Log more detailed error information
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
      }
    }
  };
  
  return (
    <div className="container-seminfo">
      <h1 className="page-title">Semester Information</h1>
      <h3 className="subtitle">Add Total Courses for Each Semester</h3>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Semester No</th>
              <th>Theory Courses</th>
              <th>Practical Courses</th>
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
                    placeholder="Enter practical courses"
                    value={row.practical_courses}
                    onChange={(e) =>
                      handleInputChange(index, "practical_courses", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Input for Total Credits */}
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
    </div>
  );
}

export default SemInfo;

