import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Summary.css";

function Summary() {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const courseTypes = ["HS", "BS", "ES", "PC", "PE", "OE", "EEC", "MC"];
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/creditsSummary");
      const backendData = response.data;

      const processedData = courseTypes.map((type) => {
        const typeData = { type, credits: {} };

        semesters.forEach((sem) => {
          const semesterCredits = backendData
            .filter((course) => course.type === type && course.sem_no === sem)
            .reduce((total, course) => total + (Number(course.credits) || 0), 0);

          typeData.credits[sem] = semesterCredits;
        });

        return typeData;
      });

      setTableData(processedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load credit summary");
      setLoading(false);
    }
  };

  const calculateRowTotal = (credits) => {
    return Object.values(credits).reduce((sum, credit) => sum + credit, 0);
  };

  const calculateColumnTotal = (semesterNum) => {
    return tableData.reduce((sum, row) => sum + (row.credits[semesterNum] || 0), 0);
  };

  if (loading) {
    return <div className="loading">Loading credit summary...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="summary-container">
      <h1 className="summary-title">Summary of Credit Distribution</h1>
      <div className="table-container">
        <table className="summary-table">
          <thead>
            <tr>
              <th>S. No</th>
              <th>Course Category</th>
              {semesters.map((sem) => (
                <th key={sem}>Sem {sem}</th>
              ))}
              <th>Total Credits</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={row.type}>
                <td>{index + 1}</td>
                <td>{row.type}</td>
                {semesters.map((sem) => (
                  <td key={sem}>{row.credits[sem] || 0}</td>
                ))}
                <td>{calculateRowTotal(row.credits)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="2">Total Credits per Semester</td>
              {semesters.map((sem) => (
                <td key={sem}>{calculateColumnTotal(sem)}</td>
              ))}
              <td>
                {tableData.reduce((sum, row) => sum + calculateRowTotal(row.credits), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Summary;


