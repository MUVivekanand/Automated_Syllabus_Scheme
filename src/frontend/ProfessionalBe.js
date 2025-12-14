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
    vertical_name: '',
    date: new Date().toISOString().substring(0, 10),
    degree: degree,
    department: department
  };

  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(initialFormState);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('LANGUAGE');
  const [verticals, setVerticals] = useState({});
  const [newVerticalName, setNewVerticalName] = useState('');
  const [showAddVerticalForm, setShowAddVerticalForm] = useState(false);

  // Group types
  const sectionTypes = {
    LANGUAGE: 'LANGUAGE ELECTIVES',
    BE: 'Professional electives for BE degree programme',
    BE_HONOURS: 'Professional Electives for BE Honours / BE Honours with specialization in same discipline and BE Minor degree programmes',
    OPEN: 'OPEN ELECTIVES',
    SDL: 'SELF DIRECTED LEARNING COURSES'
  };

  // Fetch courses and verticals from backend
  useEffect(() => {
    fetchCourses();
    fetchVerticals();
  }, [degree, department]);

  const saveCourse = async (e) => {
    e.preventDefault();
    try {
      const verticalValue = currentCourse.vertical === '' ? 0 : 
                        currentCourse.vertical ? parseInt(currentCourse.vertical) : 0;
    
      const courseData = {
        ...currentCourse,
        vertical: verticalValue,
        type: sectionTypes[activeSection], // Ensure correct type based on active section
        degree: degree,
        department: department
      };
      
      if (editing) {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/proelective/courses/${currentCourse.course_code}`, courseData);
        if (response.status === 200) {
          alert('Course updated successfully');
        }
      } else {
        console.log(courseData);
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/proelective/courses`, courseData);
        if (response.status === 201) {
          alert('Course added successfully');
        }
      }
      setCurrentCourse(initialFormState);
      setEditing(false);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to save course'}`);
    }
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

  const fetchVerticals = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/proelective/verticals?degree=${encodeURIComponent(degree)}&department=${encodeURIComponent(department)}`);
      const verticalsData = {};
      response.data.forEach(vertical => {
        verticalsData[vertical.id] = vertical.name;
      });
      setVerticals(verticalsData);
    } catch (error) {
      console.error('Error fetching verticals:', error);
      // Initialize with default verticals if none exist
      if (Object.keys(verticals).length === 0) {
        setVerticals({
          1: "VERTICAL I: Computational Intelligence",
          2: "VERTICAL II: Networking Technologies",
          3: "VERTICAL III: Security and Privacy"
        });
      }
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

  const saveVertical = async (e) => {
    e.preventDefault();
    if (!newVerticalName.trim()) {
      alert('Please enter a vertical name');
      return;
    }

    try {
      const nextVerticalId = Object.keys(verticals).length > 0 ? 
                              Math.max(...Object.keys(verticals).map(Number)) + 1 : 1;
      
      const verticalData = {
        id: nextVerticalId,
        name: newVerticalName,
        degree: degree,
        department: department
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/proelective/verticals`, verticalData);
      if (response.status === 201) {
        alert('Vertical added successfully');
        setNewVerticalName('');
        setShowAddVerticalForm(false);
        fetchVerticals();
      }
    } catch (error) {
      console.error('Error saving vertical:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to save vertical'}`);
    }
  };

  const updateVerticalName = async (id, newName) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/proelective/verticals/${id}`, {
        name: newName,
        degree: degree,
        department: department
      });
      
      if (response.status === 200) {
        fetchVerticals();
      }
    } catch (error) {
      console.error('Error updating vertical name:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to update vertical name'}`);
    }
  };

  const deleteVertical = async (id) => {
    if (window.confirm('Are you sure you want to delete this vertical? All associated courses will be deleted.')) {
      try {
        const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/proelective/verticals/${id}`);
        if (response.status === 200) {
          alert('Vertical deleted successfully');
          fetchVerticals();
          fetchCourses();
        }
      } catch (error) {
        console.error('Error deleting vertical:', error);
        alert(`Error: ${error.response?.data?.message || 'Failed to delete vertical'}`);
      }
    }
  };

  // Set current course for editing
  const editCourse = (course) => {
    setCurrentCourse(course);
    setEditing(true);
    
    // Set active section based on course type
    if (course.type === sectionTypes.LANGUAGE) {
      setActiveSection('LANGUAGE');
    } else if (course.type === sectionTypes.BE) {
      setActiveSection('BE');
    } else if (course.type === sectionTypes.BE_HONOURS) {
      setActiveSection('BE_HONOURS');
    } else if (course.type === sectionTypes.OPEN) {
      setActiveSection('OPEN');
    } else if (course.type === sectionTypes.SDL) {
      setActiveSection('SDL');
    }
  };

  // Add new course
  const addNewCourse = (type) => {
    setCurrentCourse({
      ...initialFormState,
      type: sectionTypes[type],
      vertical: type === 'BE_HONOURS' ? 1 : 0,
      degree: degree,
      department: department
    });
    setEditing(false);
    setActiveSection(type);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCourse({ ...currentCourse, [name]: value });
  };

  // Group courses by type and sort by serial number
  const groupedCourses = courses.reduce((acc, course) => {
    if (!acc[course.type]) {
      acc[course.type] = [];
    }
    acc[course.type].push(course);
    return acc;
  }, {});

  // Sort courses by serial number
  Object.keys(groupedCourses).forEach(type => {
    groupedCourses[type].sort((a, b) => a.serial_number - b.serial_number);
  });

  // Group BE Honours courses by vertical
  const honoursCoursesByVertical = courses
    .filter(course => course.type === sectionTypes.BE_HONOURS)
    .reduce((acc, course) => {
      const vertical = course.vertical || 0;
      if (!acc[vertical]) {
        acc[vertical] = [];
      }
      acc[vertical].push(course);
      return acc;
    }, {});

  // Sort each vertical group by serial number
  Object.keys(honoursCoursesByVertical).forEach(vertical => {
    honoursCoursesByVertical[vertical].sort((a, b) => a.serial_number - b.serial_number);
  });

  // Handle vertical name edit
  const handleVerticalNameEdit = (id, currentName) => {
    const newName = prompt("Enter new name for vertical:", currentName);
    if (newName && newName.trim() !== "" && newName !== currentName) {
      updateVerticalName(id, newName);
    }
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
          className={activeSection === 'LANGUAGE' ? 'active' : ''} 
          onClick={() => setActiveSection('LANGUAGE')}
        >
          Language Electives
        </button>
        <button 
          className={activeSection === 'BE' ? 'active' : ''} 
          onClick={() => setActiveSection('BE')}
        >
          BE Degree
        </button>
        <button 
          className={activeSection === 'BE_HONOURS' ? 'active' : ''} 
          onClick={() => setActiveSection('BE_HONOURS')}
        >
          BE Honours
        </button>
        <button 
          className={activeSection === 'OPEN' ? 'active' : ''} 
          onClick={() => setActiveSection('OPEN')}
        >
          Open Electives
        </button>
        <button 
          className={activeSection === 'SDL' ? 'active' : ''} 
          onClick={() => setActiveSection('SDL')}
        >
          Self Directed Learning
        </button>
      </div>

      {activeSection === 'BE_HONOURS' && (
        <div className="verticals-management">
          <h3>Verticals Management</h3>
          <div className="verticals-list">
            {Object.entries(verticals).map(([id, name]) => (
              <div key={id} className="vertical-item">
                <span>{name}</span>
                <div className="vertical-actions">
                  <button onClick={() => handleVerticalNameEdit(id, name)}>Edit</button>
                  <button onClick={() => deleteVertical(id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          
          {showAddVerticalForm ? (
            <form onSubmit={saveVertical} className="add-vertical-form">
              <input
                type="text"
                value={newVerticalName}
                onChange={(e) => setNewVerticalName(e.target.value)}
                placeholder="Enter vertical name"
                required
              />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setShowAddVerticalForm(false)}>Cancel</button>
            </form>
          ) : (
            <button 
              className="add-vertical-button" 
              onClick={() => setShowAddVerticalForm(true)}
            >
              Add New Vertical
            </button>
          )}
        </div>
      )}

      <div className="form-section">
        <h2>{sectionTypes[activeSection]}</h2>
        <form onSubmit={saveCourse}>
          <div className="form-row">
            <div className="form-group">
              <label>Serial Number</label>
              <input 
                type="number" 
                name="serial_number" 
                value={currentCourse.serial_number} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Course Code</label>
              <input 
                type="text" 
                name="course_code" 
                value={currentCourse.course_code} 
                onChange={handleInputChange} 
                required 
                disabled={editing}
              />
            </div>
            <div className="form-group">
              <label>Course Title</label>
              <input 
                type="text" 
                name="course_title" 
                value={currentCourse.course_title} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            {activeSection === 'BE_HONOURS' && (
              <div className="form-group">
                <label>Vertical</label>
                <select 
                  name="vertical" 
                  value={currentCourse.vertical || ''} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Select Vertical</option>
                  {Object.entries(verticals).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                name="date" 
                value={currentCourse.date} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>
          <div className="button-group">
            <button type="submit">
              {editing ? 'Update Course' : 'Add Course'}
            </button>
            <button 
              type="button" 
              onClick={() => addNewCourse(activeSection)}
              className="add-new"
            >
              Add New Row
            </button>
          </div>
        </form>
      </div>

      <div className="courses-display">
        <h2>Current Courses</h2>
        
        {/* Display Language Electives */}
        {groupedCourses[sectionTypes.LANGUAGE] && groupedCourses[sectionTypes.LANGUAGE].length > 0 && (
          <div className="course-section">
            <h3>LANGUAGE ELECTIVES</h3>
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedCourses[sectionTypes.LANGUAGE].map(course => (
                  <tr key={course.course_code}>
                    <td>{course.course_code}</td>
                    <td>{course.course_title}</td>
                    <td>
                      <div className="action-butto">
                        <button onClick={() => editCourse(course)}>Edit</button>
                        <button onClick={() => deleteCourse(course.course_code)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Display BE Degree Programme Courses */}
        {groupedCourses[sectionTypes.BE] && groupedCourses[sectionTypes.BE].length > 0 && (
          <div className="course-section">
            <h3>Professional electives for BE degree programme</h3>
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedCourses[sectionTypes.BE].map(course => (
                  <tr key={course.course_code}>
                    <td>{course.course_code}</td>
                    <td>{course.course_title}</td>
                    <td>
                      <div className="action-butto">
                        <button onClick={() => editCourse(course)}>Edit</button>
                        <button onClick={() => deleteCourse(course.course_code)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Display BE Honours Courses by Vertical */}
        {Object.keys(honoursCoursesByVertical).length > 0 && (
          <div className="course-section">
            <h3>Professional Electives for BE Honours / BE Honours with specialization in same discipline and BE Minor degree programmes</h3>
            {Object.keys(honoursCoursesByVertical).sort().map(vertical => (
              <div key={vertical}>
                <h4>{verticals[vertical] || `Vertical ${vertical}`}</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {honoursCoursesByVertical[vertical].map(course => (
                      <tr key={course.course_code}>
                        <td>{course.course_code}</td>
                        <td>{course.course_title}</td>
                        <td>
                          <div className="action-butto">
                            <button onClick={() => editCourse(course)}>Edit</button>
                            <button onClick={() => deleteCourse(course.course_code)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
        
        {/* Display Open Electives */}
        {groupedCourses[sectionTypes.OPEN] && groupedCourses[sectionTypes.OPEN].length > 0 && (
          <div className="course-section">
            <h3>OPEN ELECTIVES</h3>
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedCourses[sectionTypes.OPEN].map(course => (
                  <tr key={course.course_code}>
                    <td>{course.course_code}</td>
                    <td>{course.course_title}</td>
                    <td>
                      <div className="action-butto">
                        <button onClick={() => editCourse(course)}>Edit</button>
                        <button onClick={() => deleteCourse(course.course_code)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Display Self Directed Learning Courses */}
        {groupedCourses[sectionTypes.SDL] && groupedCourses[sectionTypes.SDL].length > 0 && (
          <div className="course-section">
            <h3>SELF DIRECTED LEARNING COURSES</h3>
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedCourses[sectionTypes.SDL].map(course => (
                  <tr key={course.course_code}>
                    <td>{course.course_code}</td>
                    <td>{course.course_title}</td>
                    <td>
                      <div className="action-butto">
                        <button onClick={() => editCourse(course)}>Edit</button>
                        <button onClick={() => deleteCourse(course.course_code)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfessionalBe;