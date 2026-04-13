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

  const [courseCode] = courseName.split(" - ");
  const semesterNumber = courseCode?.[3]; // 4th character
  
  const semesterMap = {
    "1": "SEMESTER – I",
    "2": "SEMESTER – II",
    "3": "SEMESTER – III",
    "4": "SEMESTER – IV",
    "5": "SEMESTER – V",
    "6": "SEMESTER – VI",
    "7": "SEMESTER – VII",
    "8": "SEMESTER – VIII",
  };
  
  const semesterTitle = semesterMap[semesterNumber] || "SEMESTER";
  const textbooks = courseDetails.textbooks || [];
  const refs = courseDetails.references || [];
  const isLabCourse =
  courseDetails?.lecture === 0 &&
  courseDetails?.tutorial === 0 &&
  courseDetails?.practical > 0;
  
  return (
    <div className="course-details-container">
      <h2 className="semester-title">{semesterTitle}</h2>
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
        {isLabCourse ? (
          <>
            <h2 className="section-title">COURSE DESCRIPTION</h2>
            <p className="lab-description">
              {courseDetails.description || "No description available."}
            </p>
          </>
        ) : (
          courseDetails.co.map((co, i) => (
            <div key={i} className="course-topic">
              <p className="topic">
                <b>{co.name}:</b> {co.desc}
              </p>
              <span className="hours">
                {courseDetails.hours[i].hour2
                  ? `(${courseDetails.hours[i].hour1} + ${courseDetails.hours[i].hour2})`
                  : `(${courseDetails.hours[i].hour1})`}
              </span>
            </div>
          ))
        )}
      </div>
      {/* Total Hours */}
      {!isLabCourse && (
        <div className="total-hours">
          <p>
            <b>Total =</b> L: 45{" "}
            {courseDetails.credits === 4 ? "+ T: 15 = 60" : ""}
          </p>
        </div>
      )}

      {/* Textbooks Section */}
      {!isLabCourse && textbooks.length > 0 && (
      <div className="section">
        <h2 className="section-title">TEXT BOOKS</h2>
        {textbooks.length > 0 ? (
          <ol className="book-list">
            {textbooks.map((book, i) => (
              <li key={i} className="book-item">
                {[
                  book.author && <b key="author">{book.author}</b>,
                  book.title,
                  book.publisher,
                  book.place,
                  book.year,
                ]
                  .filter(Boolean)
                  .map((item, index) => (
                    <span key={index}>
                      {item}
                      {index !==
                        [
                          book.author,
                          book.title,
                          book.publisher,
                          book.place,
                          book.year,
                        ].filter(Boolean).length - 1 && ", "}
                    </span>
                  ))}
              </li>
            ))}
          </ol>
        ) : (
          <p className="no-data">No textbooks available.</p>
        )}
      </div>
      )}

      {/* References Section */}
      {refs.length > 0 && (
      <div className="section">
        <h2 className="section-title">REFERENCES</h2>
        {refs.length > 0 ? (
          <ol className="book-list">
            {refs.map((ref, i) => (
              <li key={i} className="book-item">
                {[
                  ref.author && <b key="author">{ref.author}</b>,
                  ref.title,
                  ref.publisher,
                  ref.place,
                  ref.year,
                ]
                  .filter(Boolean)
                  .map((item, index) => (
                    <span key={index}>
                      {item}
                      {index !==
                        [
                          ref.author,
                          ref.title,
                          ref.publisher,
                          ref.place,
                          ref.year,
                        ].filter(Boolean).length - 1 && ", "}
                    </span>
                  ))}
              </li>
            ))}
          </ol>
        ) : (
          <p className="no-data">No references available.</p>
        )}
      </div>
      )}
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

.lab-description {
  white-space: pre-line;
}

export default CourseDetailsPage;
