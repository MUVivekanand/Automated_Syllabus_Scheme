import React, { useState } from "react";
import "../styles/SemInfo.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SemInfo() {
  const [semData, setSemData] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      semNo: i + 1,
      theoryCourses: "",
      practicalCourses: "",
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
              <th>Theory Courses</th>
              <th>Practical Courses</th>
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
                    name="theoryCourses"
                    placeholder="Enter theory courses"
                    value={row.theoryCourses}
                    onChange={(e) =>
                      handleInputChange(index, "theoryCourses", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="practicalCourses"
                    placeholder="Enter practical courses"
                    value={row.practicalCourses}
                    onChange={(e) =>
                      handleInputChange(index, "practicalCourses", e.target.value)
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
