import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../styles/Professional.css"; // Import the CSS file

function ProfessionalMe() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [degree, setDegree] = useState(searchParams.get("degree") || "");
  const [department, setDepartment] = useState(searchParams.get("department") || "");

  const [numRows, setNumRows] = useState(0);

  const [rows, setRows] = useState([]);

  const [fetchedData, setFetchedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:4000/api/proelective";

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/getproelective`);
      setFetchedData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  };

  const handleNumRowsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    setNumRows(value);

    const newRows = [];
    for (let i = 0; i < value; i++) {
      newRows.push({
        id: "",
        course_code: "",
        course_name: "",
        credits: "",
        lecture: "",
        tutorial: "",
        practical: "",
        ca_marks: "",
        fe_marks: "",
        total_marks: ""
      });
    }
    setRows(newRows);
  };

  // Handle changes in each row's cell
  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  // Add a new empty row
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: "",
        course_code: "",
        course_name: "",
        credits: "",
        lecture: "",
        tutorial: "",
        practical: "",
        ca_marks: "",
        fe_marks: "",
        total_marks: ""
      }
    ]);
  };

  // Delete a row
  const handleDeleteRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
  };

  // Update a specific row in the database
  const handleUpdateRow = async (index) => {
    try {
      setLoading(true);
      const rowToUpdate = {
        ...rows[index],
        degree,
        department
      };

      // If no ID is provided, show an error
      if (!rowToUpdate.id) {
        alert("ID is required for updates. Please provide a valid ID.");
        setLoading(false);
        return;
      }

      // Use try-catch to handle update endpoint errors
      console.log("Sending update request for row:", rowToUpdate);
      
      const response = await axios.put(`${API_BASE_URL}/updateelective`, {
        row: rowToUpdate
      });

      console.log("Update response:", response.data);
      alert(`Row #${index + 1} updated successfully!`);
      
      // Refresh the data to show updated records
      await fetchData();
      setLoading(false);
    } catch (err) {
      console.error("Error updating row:", err);
      alert(`Error updating row: ${err.response?.data?.error || err.message}`);
      setLoading(false);
    }
  };

  // Submit all rows to backend => then fetch all
  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Merge degree & department into each row
      const rowsToInsert = rows.map((row) => ({
        ...row,
        degree,
        department
      }));

      // 1. POST to backend
      await axios.post(`${API_BASE_URL}/postelective`, {
        rows: rowsToInsert,
      });
      alert("Data inserted successfully!");

      // 2. Refresh data
      await fetchData();
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Error inserting or fetching data from server.");
      setLoading(false);
    }
  };

  // Load an existing row for editing
  const handleEditExisting = (item) => {
    // Check if the item already exists in rows
    const existingIndex = rows.findIndex(row => row.id === item.id);
    
    if (existingIndex >= 0) {
      // If already in editing rows, just alert the user
      alert(`This record (ID: ${item.id}) is already being edited at row ${existingIndex + 1}.`);
      return;
    }
    
    // Add the item to the rows for editing
    setRows(prev => [...prev, { ...item }]);
  };

  return (
    <div className="professional-container">
      <h1 className="page-title">Professional Electives Management</h1>

      {/* Degree & Department inputs */}
      <div className="form-group">
        <label>Degree: </label>
        <input
          type="text"
          value={degree}
          onChange={(e) => setDegree(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Department: </label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="form-control"
        />
      </div>

      {/* Only show numRows if degree is M.E */}
      {degree === "M.E" && (
        <div className="form-group">
          <label>Number of rows: </label>
          <input
            type="number"
            value={numRows}
            onChange={handleNumRowsChange}
            className="form-control"
          />
        </div>
      )}

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Table for new row input */}
      <div className="editor-container">
        <h2 className="section-title">Add/Edit Records</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Serial No</th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Credits</th>
              <th>Lecture</th>
              <th>Tutorial</th>
              <th>Practical</th>
              <th>CA Marks</th>
              <th>FE Marks</th>
              <th>Total Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rowData, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="number"
                    value={rowData.id}
                    onChange={(e) => handleRowChange(index, "id", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={rowData.course_code}
                    onChange={(e) => handleRowChange(index, "course_code", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={rowData.course_name}
                    onChange={(e) => handleRowChange(index, "course_name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rowData.credits}
                    onChange={(e) => handleRowChange(index, "credits", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rowData.lecture}
                    onChange={(e) => handleRowChange(index, "lecture", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rowData.tutorial}
                    onChange={(e) => handleRowChange(index, "tutorial", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rowData.practical}
                    onChange={(e) => handleRowChange(index, "practical", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rowData.ca_marks}
                    onChange={(e) => handleRowChange(index, "ca_marks", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rowData.fe_marks}
                    onChange={(e) => handleRowChange(index, "fe_marks", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={rowData.total_marks}
                    onChange={(e) => handleRowChange(index, "total_marks", e.target.value)}
                  />
                </td>
                <td className="action-cell">
                  <button 
                    onClick={() => handleUpdateRow(index)} 
                    className={rowData.id ? "btn btn-success" : "btn btn-disabled"}
                    disabled={!rowData.id}
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => handleDeleteRow(index)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Button to add row (for any degree) */}
        <div style={{ marginTop: "1.5rem" }}>
          <button className="btn btn-primary" onClick={handleAddRow}>
            Add Row
          </button>

          {/* Final submit to insert data */}
          <button className="btn btn-success" onClick={handleSubmit}>
            Submit All New Rows
          </button>
        </div>
      </div>

      {/* Display the fetched data after successful insert */}
      {fetchedData.length > 0 && (
        <div className="existing-data-container">
          <h2 className="section-title">Table</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Lecture</th>
                <th>Tutorial</th>
                <th>Practical</th>
                <th>CA Marks</th>
                <th>FE Marks</th>
                <th>Total Marks</th>
                <th>Department</th>
                <th>Degree</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fetchedData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.id}</td>
                  <td>{item.course_code}</td>
                  <td>{item.course_name}</td>
                  <td>{item.credits}</td>
                  <td>{item.lecture}</td>
                  <td>{item.tutorial}</td>
                  <td>{item.practical}</td>
                  <td>{item.ca_marks}</td>
                  <td>{item.fe_marks}</td>
                  <td>{item.total_marks}</td>
                  <td>{item.department}</td>
                  <td>{item.degree}</td>
                  <td>{item.created_at}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleEditExisting(item)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProfessionalMe;