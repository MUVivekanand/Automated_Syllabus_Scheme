import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../styles/Summary.css";
import Navbar from './Navbar';

function Summary() {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCreditsMismatch, setTotalCreditsMismatch] = useState(false);
  const [expectedTotalCredits, setExpectedTotalCredits] = useState(null);
  const [calculatedTotalCredits, setCalculatedTotalCredits] = useState(null);
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");

  const location = useLocation();
  
  // Dynamically set course types and semesters based on degree
  const getCourseTypes = (degree) => {
    if (degree === "M.E") {
      return ["HS", "BS", "ES", "PC", "PE", "OE", "EEC", "MC", "RMC"];
    }
    return ["HS", "BS", "ES", "PC", "PE", "OE", "EEC", "MC"];
  };
  
  const getSemesters = (degree) => {
    if (degree === "M.E") {
      return Array.from({ length: 4 }, (_, i) => i + 1);
    }
    return Array.from({ length: 8 }, (_, i) => i + 1);
  };
  
  const [courseTypes, setCourseTypes] = useState(["HS", "BS", "ES", "PC", "PE", "OE", "EEC", "MC"]);
  const [semesters, setSemesters] = useState(Array.from({ length: 8 }, (_, i) => i + 1));

  useEffect(() => {
    // Extract degree and department from URL parameters
    const params = new URLSearchParams(location.search);
    const degreeParam = params.get("degree") || "";
    const departmentParam = params.get("department") || "";
    
    setDegree(degreeParam);
    setDepartment(departmentParam);
    
    // Update course types and semesters based on degree
    setCourseTypes(getCourseTypes(degreeParam));
    setSemesters(getSemesters(degreeParam));
    
    // Only fetch data if we have degree and department
    if (degreeParam) {
      fetchData(degreeParam, departmentParam);
    }
  }, [location]);

  const fetchData = async (degree, department) => {
    try {
      // Get dynamic course types and semesters based on degree
      const dynamicCourseTypes = getCourseTypes(degree);
      const dynamicSemesters = getSemesters(degree);
      
      // Fetch both credits summary and total credits with filtering
      const [creditsSummaryResponse, totalCreditsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/summary/creditsSummary`, {
          params: { degree, department }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/summary/getTotalCredits`, {
          params: { degree, department }
        })
      ]);

      const backendData = creditsSummaryResponse.data;
      const storedTotalCredits = totalCreditsResponse.data.total_credits;

      const processedData = dynamicCourseTypes.map((type) => {
        const typeData = { type, credits: {} };

        dynamicSemesters.forEach((sem) => {
          const semesterCredits = backendData
            .filter((course) => course.type === type && course.sem_no === sem)
            .reduce((total, course) => total + (Number(course.credits) || 0), 0);

          typeData.credits[sem] = semesterCredits;
        });

        return typeData;
      });

      setTableData(processedData);

      // Calculate total credits
      const totalCalculatedCredits = processedData.reduce(
        (sum, row) => sum + calculateRowTotal(row.credits), 
        0
      );

      setExpectedTotalCredits(Number(storedTotalCredits));
      setCalculatedTotalCredits(totalCalculatedCredits);

      // Alert with credits information
      const alertMessage = storedTotalCredits
        ? `Total Credits Check:
Expected Credits: ${storedTotalCredits}
Calculated Credits: ${totalCalculatedCredits}
${Number(storedTotalCredits) === totalCalculatedCredits 
  ? 'Credits Match ✅' 
  : 'Credits Do Not Match ❌'}`
        : 'No total credits value found';

      window.alert(alertMessage);

      if (storedTotalCredits && 
          Number(storedTotalCredits) !== totalCalculatedCredits) {
        setTotalCreditsMismatch(true);
      }

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
      <Navbar/>
      {totalCreditsMismatch && (
        <div className="error-banner">
          Warning: Total credits mismatch! 
          Expected: {expectedTotalCredits}, 
          Calculated: {calculatedTotalCredits}
        </div>
      )}
      <h1 className="summary-title">
        Summary of Credit Distribution - {degree} {department}
      </h1>
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