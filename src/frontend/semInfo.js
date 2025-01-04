import React, { useState } from "react";
import "../styles/SemInfo.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SemInfo() {
  // Initialize state with unique objects for each semester
  const [semData, setSemData] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      semNo: i + 1,
      totalCourses: "",
      totalCredits: "",
    }))
  );
  const navigate = useNavigate();

  // Handle input changes for each field
  const handleInputChange = (index, field, value) => {
    const updatedData = [...semData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setSemData(updatedData);
  };

  // Handle form submission
  const handleSubmit = async () => {
    console.log("Submitting semData:", semData);

    // const hasEmptyFields = semData.some(
    //   (row) => !row.totalCourses || !row.totalCredits
    // );
  
    // if (hasEmptyFields) {
    //   alert("Please fill out all fields before submitting.");
    //   return;
    // }

    try {
      const response = await axios.post("http://localhost:4000/updateSemInfo", semData);
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
    }
  };

  return (
    <div className="container-seminfo">
      <h1 className="page-title">Semester Information</h1>
      <h3 className="subtitle">Add Total Courses and Credits for Each Semester</h3>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Semester No</th>
              <th>Total Courses</th>
              <th>Total Credits</th>
            </tr>
          </thead>
          <tbody>
            {semData.map((row, index) => (
              <tr key={index}>
                <td>{row.semNo}</td>
                <td>
                  <input
                    type="number"
                    name="totalCourses"
                    placeholder="Enter total courses"
                    value={row.totalCourses}
                    onChange={(e) =>
                      handleInputChange(index, "totalCourses", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="totalCredits"
                    placeholder="Enter total credits"
                    value={row.totalCredits}
                    onChange={(e) =>
                      handleInputChange(index, "totalCredits", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleSubmit} className="submit-button">
        Submit
      </button>
    </div>
  );
}

export default SemInfo;
