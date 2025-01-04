import React, { useState, useEffect } from "react";
import "../styles/syllabus.css";
import axios from "axios";

function Syllabus() {

  const [filterForm, setfilterForm] = useState({
    filterSem: "",
    FilterDep: "",
  });

  const [formData, setFormData] = useState({
    semNo: "",
    caMarks: "",
    feMarks: "",
    totalMarks: "",
    department: "",
    courseCode: "",
    courseName: "",
    lecture: "",
    tutorial: "",
    practical: "",
    type: "",
    faculty: "",
  });

  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});

  const [tableData, setTableData] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);

  const [rowCount, setRowCount] = useState(0);
  const maxRows = 10; // Maximum number of rows allowed

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setfilterForm((prev) => ({ ...prev, [name]: value }));
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchTableData = async () => {
    try {
      const response = await axios.get('http://localhost:4000/getTableData');
      if (response.data.success) {
        setTableData(response.data.data);
        setRowCount(response.data.data.length);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const handleEditClick = (rowIndex) => {
    setEditingRow(rowIndex);
    setEditedData(tableData[rowIndex]); 
  };

  const handleTickClick = async (rowIndex) => {
    try {
      const updatedRow = editedData;
      await axios.put('http://localhost:4000/updateTableData', updatedRow);
      setTableData((prevData) =>
        prevData.map((row, index) =>
          index === rowIndex ? { ...row, ...updatedRow } : row
        )
      );
      setEditingRow(null);
    } catch (error) {
      console.error('Error updating data:', error);
    }
  };

  const addRow = async () => {
    if (rowCount >= maxRows) {
      alert(`Cannot add more rows. Maximum limit of ${maxRows} rows reached.`);
      return;
    }

    const rowData = {
      semNo: Number(formData.semNo),
      caMarks: Number(formData.caMarks),
      feMarks: Number(formData.feMarks),
      totalMarks: Number(formData.totalMarks),
      department: formData.department,
      courseCode: formData.courseCode,
      courseName: formData.courseName,
      lecture: Number(formData.lecture),
      tutorial: Number(formData.tutorial),
      practical: Number(formData.practical),
      type: formData.type,
      faculty: formData.faculty
    };

    try {
      const response = await axios.post('http://localhost:4000/addRow', rowData);
      if (response.data.success) {
        setFormData({
          ...formData,
          courseCode: "",
          courseName: "",
          lecture: "",
          tutorial: "",
          practical: "",
          type: "",
          faculty: ""
        });
        setRowCount((prev) => prev + 1);
        alert('Row added successfully');
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert(`Failed to add row: ${error.response?.data?.error || error.message}`);
    }
  };

  const filtertable = async () => {
    const filterData = {
      filterSem: Number(filterForm.filterSem),
      FilterDep: filterForm.FilterDep
    };

    try {
      const response = await axios.post('http://localhost:4000/filtertable', filterData);
      if (response.data.success) {
        setfilterForm({
          filterSem: "",
          FilterDep: "",
        });
        setIsFiltered(true);
        fetchTableData();
        alert("Applied filter");
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert(`Failed to add row: ${error.response?.data?.error || error.message}`);
    }
  };

  const clearFilters = async () => {
    try {
      const response = await axios.post('http://localhost:4000/clearFilters');
      if (response.data.success) {
        setIsFiltered(false);
        fetchTableData();
        alert("Filters cleared");
      }
    } catch (error) {
      console.error('Error clearing filters:', error);
      alert('Failed to clear filters');
    }
  };

  return (
    <div className="container-syllabus">
      <h1 className="sylltitle">Syllabus - Course and Scheme of Assessment</h1>
      <h3 className="regulationtext">AS PER THE REGULATIONS OF 2019</h3>

      <div className="form-container">
        <div className="form-part">
          <h4 className="part-title">Common Information</h4>
          <div className="form-fields">
            <input
              type="text"
              name="semNo"
              placeholder="Enter sem no"
              value={formData.semNo}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="caMarks"
              placeholder="Enter CA marks"
              value={formData.caMarks}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="feMarks"
              placeholder="Enter FE marks"
              value={formData.feMarks}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="totalMarks"
              placeholder="Enter total marks"
              value={formData.totalMarks}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="department"
              placeholder="Enter department name"
              value={formData.department}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-part">
          <h4 className="part-title">Course Details</h4>
          <div className="form-fields">
            <input
              type="text"
              name="courseCode"
              placeholder="Enter course code"
              value={formData.courseCode}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="courseName"
              placeholder="Enter course name"
              value={formData.courseName}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="lecture"
              placeholder="Enter lecture hours"
              value={formData.lecture}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="tutorial"
              placeholder="Enter tutorial hours"
              value={formData.tutorial}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="practical"
              placeholder="Enter practical hours"
              value={formData.practical}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="type"
              placeholder="Enter type"
              value={formData.type}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="faculty"
              placeholder="Enter faculty assigned"
              value={formData.faculty}
              onChange={handleInputChange}
            />
          </div>

          <button onClick={addRow} className="generate-table-button">
            Add Details
          </button>
        </div>
      </div>

      <button onClick={fetchTableData} className="generate-table-button">
        Generate Table
      </button>

      <p className="total-rows">Total Rows Entered: {rowCount}/{maxRows}</p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Lecture</th>
              <th>Tutorial</th>
              <th>Practical</th>
              <th>Credits</th>
              <th>CA</th>
              <th>FE</th>
              <th>Total</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td>
                  {editingRow === index ? (
                    <input
                      type="text"
                      name="course_code"
                      value={editedData.course_code}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.course_code
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="text"
                      name="course_name"
                      value={editedData.course_name}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.course_name
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="number"
                      name="lecture"
                      value={editedData.lecture}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.lecture
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="number"
                      name="tutorial"
                      value={editedData.tutorial}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.tutorial
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="number"
                      name="practical"
                      value={editedData.practical}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.practical
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="number"
                      name="credits"
                      value={editedData.credits}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.credits
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="number"
                      name="ca_marks"
                      value={editedData.ca_marks}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.ca_marks
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="number"
                      name="fe_marks"
                      value={editedData.fe_marks}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.fe_marks
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="number"
                      name="total_marks"
                      value={editedData.total_marks}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.total_marks
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <input
                      type="text"
                      name="type"
                      value={editedData.type}
                      onChange={handleInputChange}
                    />
                  ) : (
                    row.type
                  )}
                </td>
                <td>
                  {editingRow === index ? (
                    <button onClick={() => handleTickClick(index)}>✔</button>
                  ) : (
                    <button onClick={() => handleEditClick(index)}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-container">
        <div className="form-part">
          <h4 className="part-title">Filter Details</h4>
          <div className="form-fields">
            <input
              type="number"
              name="filterSem"
              placeholder="Enter sem no"
              value={filterForm.filterSem}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="FilterDep"
              placeholder="Enter the department"
              value={filterForm.FilterDep}
              onChange={handleInputChange}
            />
          </div>
          <button onClick={filtertable} className="generate-table-button">
            Apply filter
          </button>
          <button onClick={clearFilters} disabled={!isFiltered} className="generate-table-button">
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default Syllabus;
