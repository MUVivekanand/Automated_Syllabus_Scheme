import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import "../styles/ProfessionalBe.css";
import Navbar from './Navbar';

function ProfessionalBe() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const degree = queryParams.get('degree') || '';
  const department = queryParams.get('department') || '';

  const initialFormState = {
    serial_number: '',
    course_code: '',
    course_title: '',
    type: '',
    vertical: '',
    faculty: '',
    vertical_name: '',
    date: new Date().toISOString().substring(0, 10),
    degree: degree,
    department: department
  };

  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(initialFormState);
  const [editing, setEditing] = useState(false);
  const [editingCourseCode, setEditingCourseCode] = useState(null);
  const [activeSection, setActiveSection] = useState('LANGUAGE');
  const [verticals, setVerticals] = useState({});
  const [electiveTypes, setElectiveTypes] = useState([]);
  const [numberOfCourses, setNumberOfCourses] = useState(1);
  const [courseRows, setCourseRows] = useState([initialFormState]);
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  const [newTypeData, setNewTypeData] = useState({ name: '', vertical: [] });
  const [editingType, setEditingType] = useState(null);
  const [editTypeData, setEditTypeData] = useState({ name: '', vertical: [] });
  const [showElectiveTypes, setShowElectiveTypes] = useState(false);
  const [verticalList, setVerticalList] = useState([]);
  const [showAddVerticalForm, setShowAddVerticalForm] = useState(false);
  const [newVerticalData, setNewVerticalData] = useState({ id: '', name: '' });
  const [editingVertical, setEditingVertical] = useState(null);
  const [editVerticalData, setEditVerticalData] = useState({ id: '', name: '' });
  const [showVerticals, setShowVerticals] = useState(false);

  // Fetch courses and elective types from backend
  useEffect(() => {
    fetchCourses();
    fetchElectiveTypes();
    fetchVerticals();
  }, [degree, department]);

  // Fetch verticals when elective types change
  useEffect(() => {
    const fetchAllVerticals = async () => {
      const allVerticalIds = [...new Set(electiveTypes.flatMap(type => type.vertical))];
      if (allVerticalIds.length > 0) {
        const verticalsData = await fetchVerticalsForType(allVerticalIds);
        setVerticals((prev) => ({ ...prev, ...verticalsData }));
      }
    };
    fetchAllVerticals();
  }, [electiveTypes]);

  const saveCourse = async (e) => {
    e.preventDefault();
    try {
      // If editing, only allow single-row update
      if (editing) {
        if (!editingCourseCode) {
          alert('No course selected for editing');
          return;
        }

        if (courseRows.length !== 1) {
          alert('Please edit only one course at a time');
          return;
        }

        const row = courseRows[0];
        if (!row.serial_number || !row.course_title || !row.type) {
          alert('Please fill all required fields');
          return;
        }

        const verticalValue = row.vertical === '' ? 0 :
                          row.vertical ? parseInt(row.vertical, 10) : 0;

        const payload = {
          serial_number: row.serial_number,
          course_title: row.course_title,
          type: row.type,
          vertical: verticalValue,
          faculty: row.faculty || null,
          date: row.date,
          degree: degree,
          department: department
        };

        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/proelective/courses/${editingCourseCode}`,
          payload
        );

        alert('Course updated successfully');
        setEditing(false);
        setEditingCourseCode(null);
        setCourseRows([initialFormState]);
        setNumberOfCourses(1);
        fetchCourses();
        return;
      }

      // Validate all rows
      for (let i = 0; i < courseRows.length; i++) {
        const row = courseRows[i];
        if (!row.serial_number || !row.course_code || !row.course_title || !row.type) {
          alert(`Please fill all required fields for row ${i + 1}`);
          return;
        }
      }

      // Send all courses
      const coursePromises = courseRows.map(row => {
        const verticalValue = row.vertical === '' ? 0 : 
                          row.vertical ? parseInt(row.vertical) : 0;
        
        const courseData = {
          ...row,
          vertical: verticalValue,
          faculty: row.faculty || null,
          degree: degree,
          department: department
        };
        
        return axios.post(`${process.env.REACT_APP_API_URL}/api/proelective/courses`, courseData);
      });

      await Promise.all(coursePromises);
      alert('Courses added successfully');
      setCourseRows([initialFormState]);
      setNumberOfCourses(1);
      fetchCourses();
    } catch (error) {
      console.error('Error saving courses:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to save courses'}`);
    }
  };

  const handleNumberOfCoursesChange = (e) => {
    const num = parseInt(e.target.value) || 1;
    setNumberOfCourses(num);
    const newRows = [];
    for (let i = 0; i < num; i++) {
      newRows.push(courseRows[i] || { ...initialFormState });
    }
    setCourseRows(newRows);
  };

  const handleCourseRowChange = (index, field, value) => {
    const newRows = [...courseRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setCourseRows(newRows);
  };

  const addNewCourseRow = () => {
    setCourseRows([...courseRows, { ...initialFormState }]);
    setNumberOfCourses(courseRows.length + 1);
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/proelective/courses?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      alert(`Error fetching courses: ${error.message}`);
    }
  };

  const fetchElectiveTypes = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/proelective/types?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`);
      setElectiveTypes(response.data);
    } catch (error) {
      console.error('Error fetching elective types:', error);
      alert(`Error fetching elective types: ${error.message}`);
    }
  };

  const fetchVerticals = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/proelective/verticals?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`);
      setVerticalList(response.data);
      const verticalMap = {};
      response.data.forEach((vertical) => {
        verticalMap[vertical.id] = vertical.name;
      });
      setVerticals((prev) => ({ ...prev, ...verticalMap }));
    } catch (error) {
      console.error('Error fetching verticals:', error);
      alert(`Error fetching verticals: ${error.message}`);
    }
  };

  const saveElectiveType = async (e) => {
    e.preventDefault();
    if (!newTypeData.name.trim()) {
      alert('Please enter a type name');
      return;
    }

    try {
      const typeData = {
        degree: degree,
        department: department,
        name: newTypeData.name,
        vertical: newTypeData.vertical
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/proelective/types`, typeData);
      if (response.status === 201) {
        alert('Elective type added successfully');
        setNewTypeData({ name: '', vertical: [] });
        setShowAddTypeForm(false);
        fetchElectiveTypes();
      }
    } catch (error) {
      console.error('Error saving elective type:', error);
      alert(`Error: ${error.response?.data?.error || 'Failed to save elective type'}`);
    }
  };

  const updateElectiveType = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editTypeData.name.trim()) {
      alert('Please enter a type name');
      return;
    }

    try {
      const typeData = {
        old_degree: editingType.degree,
        old_department: editingType.department,
        old_name: editingType.name,
        degree: degree,
        department: department,
        name: editTypeData.name,
        vertical: editTypeData.vertical
      };

      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/proelective/types`, typeData);
      if (response.status === 200) {
        alert('Elective type updated successfully');
        setEditingType(null);
        setEditTypeData({ name: '', vertical: [] });
        fetchElectiveTypes();
      }
    } catch (error) {
      console.error('Error updating elective type:', error);
      alert(`Error: ${error.response?.data?.error || 'Failed to update elective type'}`);
    }
  };

  const deleteElectiveType = async (type) => {
    if (window.confirm('Are you sure you want to delete this elective type?')) {
      try {
        const deleteData = {
          degree: type.degree,
          department: type.department,
          name: type.name
        };

        const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/proelective/types`, { data: deleteData });
        if (response.status === 200) {
          alert('Elective type deleted successfully');
          fetchElectiveTypes();
          fetchCourses();
        }
      } catch (error) {
        console.error('Error deleting elective type:', error);
        alert(`Error: ${error.response?.data?.error || 'Failed to delete elective type'}`);
      }
    }
  };

  const saveVertical = async (e) => {
    e.preventDefault();
    if (!newVerticalData.id || !newVerticalData.name.trim()) {
      alert('Please enter both Vertical ID and name');
      return;
    }

    try {
      const payload = {
        id: parseInt(newVerticalData.id, 10),
        name: newVerticalData.name.trim(),
        degree,
        department
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/proelective/verticals`, payload);
      if (response.status === 201) {
        alert('Vertical added successfully');
        setNewVerticalData({ id: '', name: '' });
        setShowAddVerticalForm(false);
        fetchVerticals();
      }
    } catch (error) {
      console.error('Error saving vertical:', error);
      alert(`Error: ${error.response?.data?.error || 'Failed to save vertical'}`);
    }
  };

  const updateVertical = async (e) => {
    e.preventDefault();
    if (!editVerticalData.name.trim()) {
      alert('Please enter a vertical name');
      return;
    }

    try {
      const payload = {
        name: editVerticalData.name.trim(),
        degree,
        department
      };

      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/proelective/verticals/${editingVertical.id}`, payload);
      if (response.status === 200) {
        alert('Vertical updated successfully');
        setEditingVertical(null);
        setEditVerticalData({ id: '', name: '' });
        fetchVerticals();
      }
    } catch (error) {
      console.error('Error updating vertical:', error);
      alert(`Error: ${error.response?.data?.error || 'Failed to update vertical'}`);
    }
  };

  const deleteVertical = async (vertical) => {
    if (window.confirm('Deleting a vertical will also delete all courses assigned to it. Continue?')) {
      try {
        const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/proelective/verticals/${vertical.id}`);
        if (response.status === 200) {
          alert('Vertical deleted successfully');
          fetchVerticals();
          fetchCourses();
        }
      } catch (error) {
        console.error('Error deleting vertical:', error);
        alert(`Error: ${error.response?.data?.error || 'Failed to delete vertical'}`);
      }
    }
  };

  const fetchVerticalsForType = async (verticalIds) => {
    if (verticalIds.length === 0) return {};

    try {
      const verticalPromises = verticalIds.map(id =>
        axios.get(`${process.env.REACT_APP_API_URL}/api/proelective/verticals/${id}?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`)
      );
      const responses = await Promise.all(verticalPromises);
      const verticalsData = {};
      responses.forEach(response => {
        const vertical = response.data;
        verticalsData[vertical.id] = vertical.name;
      });
      return verticalsData;
    } catch (error) {
      console.error('Error fetching verticals for type:', error);
      return {};
    }
  };

  const deleteCourse = async (course_code) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/proelective/courses/${course_code}`);
        if (response.status === 200) {
          alert('Course deleted successfully');
        }
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert(`Error: ${error.response?.data?.message || 'Failed to delete course'}`);
      }
    }
  };

  // Set current course for editing
  const editCourse = (course) => {
    // For editing, we need to populate the form with the course data
    // Since we have multiple rows now, we'll set the first row to the course data
    setCourseRows([course]);
    setNumberOfCourses(1);
    setActiveSection(course.type);
    setEditing(true);
    setEditingCourseCode(course.course_code);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCourse({ ...currentCourse, [name]: value });
  };

  return (
    <div className="container">
      <Navbar/>
      <h1>Elective Courses Management</h1>
      <div className="program-info">
        <h2>Degree: {degree}</h2>
        <h2>Department: {department}</h2>
      </div>
      
      <div className="tabs">
        <button
          type="button"
          className="view-types-button"
          onClick={() => setShowElectiveTypes((prev) => !prev)}
        >
          {showElectiveTypes ? 'Hide Elective Types' : 'View & Edit Elective Types'}
        </button>
        {showAddTypeForm ? (
          <form onSubmit={saveElectiveType} className="add-type-form">
            <input
              type="text"
              value={newTypeData.name}
              onChange={(e) => setNewTypeData({ ...newTypeData, name: e.target.value })}
              placeholder="Enter type name"
              required
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setShowAddTypeForm(false)}>Cancel</button>
          </form>
        ) : (
          <button 
            className="add-type-button" 
            onClick={() => setShowAddTypeForm(true)}
          >
            Add New Type
          </button>
        )}
      </div>

      {showElectiveTypes && (
        <div className="elective-types-panel">
          <div className="elective-types-header">
            <h2>Elective Types</h2>
          </div>
          {electiveTypes.length === 0 ? (
            <p>No elective types found.</p>
          ) : (
            <div className="elective-types-list">
              {electiveTypes.map((type, index) => (
                <div key={index} className="type-row">
                  <div className="type-card">
                    <div className="type-info">
                      <div className="type-name">{type.name}</div>
                      <div className="type-meta">
                        Verticals: {type.vertical?.length ? type.vertical.join(', ') : 'None'}
                      </div>
                    </div>
                    <div className="type-actions">
                      <button onClick={() => {
                        setEditingType(type);
                        setEditTypeData({ name: type.name, vertical: type.vertical });
                      }}>Edit</button>
                      <button onClick={() => deleteElectiveType(type)}>Delete</button>
                    </div>
                  </div>

                  {editingType && editingType.name === type.name && (
                    <div className="type-edit-row">
                      <input
                        type="text"
                        value={editTypeData.name}
                        onChange={(e) => setEditTypeData({ ...editTypeData, name: e.target.value })}
                        placeholder="Enter type name"
                        required
                      />
                      <button onClick={updateElectiveType}>Update</button>
                      <button type="button" onClick={() => setEditingType(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="verticals-section">
        {/* <h2>Verticals</h2> */}
        <div className="verticals-actions">
          <button
            type="button"
            className="view-verticals-button"
            onClick={() => setShowVerticals((prev) => !prev)}
          >
            {showVerticals ? 'Hide Verticals' : 'View & Edit Verticals'}
          </button>
          {showAddVerticalForm ? (
            <form onSubmit={saveVertical} className="add-vertical-form">
              <input
                type="number"
                value={newVerticalData.id}
                onChange={(e) => setNewVerticalData({ ...newVerticalData, id: e.target.value })}
                placeholder="Vertical ID"
                required
              />
              <input
                type="text"
                value={newVerticalData.name}
                onChange={(e) => setNewVerticalData({ ...newVerticalData, name: e.target.value })}
                placeholder="Vertical Name"
                required
              />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setShowAddVerticalForm(false)}>Cancel</button>
            </form>
          ) : (
            <button className="add-vertical-button" onClick={() => setShowAddVerticalForm(true)}>
              Add New Vertical
            </button>
          )}
        </div>

        {showVerticals && (
          <>
            {editingVertical && (
              <div className="edit-vertical-form">
                <h3>Edit Vertical</h3>
                <form onSubmit={updateVertical}>
                  <input type="number" value={editVerticalData.id} disabled />
                  <input
                    type="text"
                    value={editVerticalData.name}
                    onChange={(e) => setEditVerticalData({ ...editVerticalData, name: e.target.value })}
                    placeholder="Vertical Name"
                    required
                  />
                  <button type="submit">Update</button>
                  <button type="button" onClick={() => setEditingVertical(null)}>Cancel</button>
                </form>
              </div>
            )}

            {verticalList.length === 0 ? (
              <p>No verticals found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verticalList.sort((a, b) => a.id - b.id).map((vertical) => (
                    <tr key={vertical.id}>
                      <td>{vertical.id}</td>
                      <td>{vertical.name}</td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => {
                            setEditingVertical(vertical);
                            setEditVerticalData({ id: vertical.id, name: vertical.name });
                          }}>
                            Edit
                          </button>
                          <button onClick={() => deleteVertical(vertical)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div className="form-section">
        <h2>Add New Courses</h2>
        <div className="number-of-courses">
          <label>Number of Courses to Add:</label>
          <input
            type="number"
            min="1"
            value={numberOfCourses}
            onChange={handleNumberOfCoursesChange}
          />
        </div>
        <form onSubmit={saveCourse}>
          {courseRows.map((row, index) => (
            <div key={index} className="course-row">
              <h3>Course {index + 1}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Serial Number</label>
                  <input 
                    type="number" 
                    value={row.serial_number} 
                    onChange={(e) => handleCourseRowChange(index, 'serial_number', e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Course Code</label>
                  <input 
                    type="text" 
                    value={row.course_code} 
                    onChange={(e) => handleCourseRowChange(index, 'course_code', e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Course Title</label>
                  <input 
                    type="text" 
                    value={row.course_title} 
                    onChange={(e) => handleCourseRowChange(index, 'course_title', e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Faculty</label>
                  <input
                    type="text"
                    value={row.faculty || ''}
                    onChange={(e) => handleCourseRowChange(index, 'faculty', e.target.value)}
                    placeholder="Faculty (optional)"
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={row.type} 
                    onChange={(e) => handleCourseRowChange(index, 'type', e.target.value)} 
                    required
                  >
                    <option value="">Select Type</option>
                    {electiveTypes.map((type, typeIndex) => (
                      <option key={typeIndex} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const selectedType = electiveTypes.find(t => t.name === row.type);
                  if (selectedType && selectedType.vertical.length > 0) {
                    return (
                      <div className="form-group">
                        <label>Vertical</label>
                        <select 
                          value={row.vertical || ''} 
                          onChange={(e) => handleCourseRowChange(index, 'vertical', e.target.value)} 
                        >
                          <option value="">Select Vertical</option>
                          {selectedType.vertical.map(id => (
                            <option key={id} value={id}>{verticals[id] || `Vertical ${id}`}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={row.date} 
                    onChange={(e) => handleCourseRowChange(index, 'date', e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="button-group">
            <button type="submit">Add Courses</button>
            <button 
              type="button" 
              onClick={addNewCourseRow}
              className="add-new"
            >
              Add New Row
            </button>
          </div>
        </form>
      </div>

      <div className="courses-display">
        <h2>Current Courses</h2>
        
        {electiveTypes.map(type => {
          const typeCourses = courses.filter(course => course.type === type.name);
          if (typeCourses.length === 0) return null;
          
          return (
            <div key={type.name} className="course-section">
              <h3>{type.name}</h3>
              {type.vertical.length > 0 ? (
                type.vertical.map(verticalId => {
                  const verticalCourses = typeCourses.filter(course => course.vertical === verticalId);
                  if (verticalCourses.length === 0) return null;
                  
                  return (
                    <div key={verticalId}>
                      <h4>{verticals[verticalId] || `Vertical ${verticalId}`}</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Serial Number</th>
                            <th>Course Code</th>
                            <th>Course Title</th>
                            <th>Faculty</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {verticalCourses.sort((a, b) => a.serial_number - b.serial_number).map(course => (
                            <tr key={course.course_code}>
                              <td>{course.serial_number}</td>
                              <td>{course.course_code}</td>
                              <td>{course.course_title}</td>
                              <td>{course.faculty || '-'}</td>
                              <td>
                                <div className="action-buttons">
                                  <button onClick={() => editCourse(course)}>Edit</button>
                                  <button onClick={() => deleteCourse(course.course_code)}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Serial Number</th>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Faculty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeCourses.sort((a, b) => a.serial_number - b.serial_number).map(course => (
                      <tr key={course.course_code}>
                        <td>{course.serial_number}</td>
                        <td>{course.course_code}</td>
                        <td>{course.course_title}</td>
                        <td>{course.faculty || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => editCourse(course)}>Edit</button>
                            <button onClick={() => deleteCourse(course.course_code)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProfessionalBe;
