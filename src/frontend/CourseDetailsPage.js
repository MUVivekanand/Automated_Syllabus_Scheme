import React from "react";
import { useLocation } from "react-router-dom";
import "../styles/CourseDetailsPage.css"; // Import updated styles
import { useNavigate } from 'react-router-dom';

function CourseDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Change this path to your desired destination page
  const handleGoBack = () => {
    navigate('/Faculty'); // Replace with your desired route
  };
  const { courseName, courseDetails } = location.state || {};

  if (!courseName) {
    return <p className="error-message">No course details found.</p>;
  }

  const textbooks = courseDetails.textbooks || [];
  const refs = courseDetails.references || [];

  return (
    <div className="course-details-container">
      <h2 className="semester-title">SEMESTER – I</h2>
      <div className="course-header">
        <h1 className="course-title">{courseName}</h1>{" "}
        {/* Displays "course code - course name" */}
        <p className="course-credit-right">
          {courseDetails.lecture} {courseDetails.tutorial}{" "}
          {courseDetails.practical} {courseDetails.credits}
        </p>
      </div>

      {/* Detailed Course Topics Section */}
      <div className="section">
        {courseDetails.co.map((co, i) => (
          <div key={i} className="course-topic">
            <p className="topic">
              <b>{co.name}:</b> {co.desc}
            </p>
            <span className="hours">
              ({courseDetails.hours[i].hour1} + {courseDetails.hours[i].hour2})
            </span>
          </div>
        ))}
      </div>

      {/* Total Hours */}
      <div className="total-hours">
        <p>
          <b>Total =</b> L: 45{" "}
          {courseDetails.credits === 4 ? "+ T: 15 = 60" : ""}
        </p>
      </div>

      {/* Textbooks Section */}
      <div className="section">
        <h2 className="section-title">TEXT BOOKS</h2>
        {textbooks.length > 0 ? (
          <ol className="book-list">
            {textbooks.map((book, i) => (
              <li key={i} className="book-item">
                <b>{book.author}</b>, {book.title}, {book.publisher},{" "}
                {book.place}, {book.year}.
              </li>
            ))}
          </ol>
        ) : (
          <p className="no-data">No textbooks available.</p>
        )}
      </div>

      {/* References Section */}
      <div className="section">
        <h2 className="section-title">REFERENCES</h2>
        {refs.length > 0 ? (
          <ol className="book-list">
            {refs.map((ref, i) => (
              <li key={i} className="book-item">
                <b>{ref.author}</b>, {ref.title}, {ref.publisher}, {ref.place},{" "}
                {ref.year}.
              </li>
            ))}
          </ol>
        ) : (
          <p className="no-data">No references available.</p>
        )}
      </div>
      <button 
        onClick={handleGoBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '12px 24px',
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#333';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#000';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        }}
      >
        ← Go Back
      </button>
    </div>
  );
}

export default CourseDetailsPage;
