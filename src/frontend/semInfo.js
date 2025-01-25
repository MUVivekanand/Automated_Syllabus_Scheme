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
  const [totalCredits, setTotalCredits] = useState(""); 
  const navigate = useNavigate();

  const handleInputChange = (index, field, value) => {
    const updatedData = [...semData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setSemData(updatedData);
  };

  const handleTotalCreditsChange = (e) => {
    setTotalCredits(e.target.value);
  };

  const handleSubmit = async () => {
    try {
        const isValidData = semData.every(row => 
            row.theory_courses !== "" && row.practical_courses !== ""
        );

        if (!totalCredits) {
            alert("Please enter total credits.");
            return;
        }

        // Separate payload for seminfo
        const semInfoPayload = semData.map(row => ({
            sem_no: row.sem_no,
            theory_courses: row.theory_courses,
            practical_courses: row.practical_courses,
            total_credits: totalCredits
        }));

        // Calculate serial numbers and create credits payload
        let serialNo = 1;
        const creditsPayload = semData.flatMap(semester => {
            const theoryRows = Array.from({ length: parseInt(semester.theory_courses) }, () => ({
                sem_no: semester.sem_no,
                category: 'theory',
                serial_no: serialNo++ // Assign and increment serial number
            }));

            const practicalRows = Array.from({ length: parseInt(semester.practical_courses) }, () => ({
                sem_no: semester.sem_no,
                category: 'practical',
                serial_no: serialNo++ // Assign and increment serial number
            }));

            return [...theoryRows, ...practicalRows];
        });

        // First request to seminfo
        const semInfoResponse = await axios.post("http://localhost:4000/api/updateSemInfo", {
            semData: semInfoPayload
        });

        // Second request to credits
        const creditsResponse = await axios.post("http://localhost:4000/api/updateCredits", {
            creditsData: creditsPayload
        });

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

