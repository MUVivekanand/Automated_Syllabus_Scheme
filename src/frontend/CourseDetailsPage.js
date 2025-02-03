import React from "react";
import { useLocation } from "react-router-dom";
import "../styles/CourseDetailsPage.css"; // Import updated styles

function CourseDetailsPage() {
  const location = useLocation();
  const { courseName, courseDetails } = location.state || {};

  if (!courseName) {
    return <p className="error-message">No course details found.</p>;
  }

  return (
    <div className="course-details-container">
      <div className="course-card">
        <h1 className="course-title">📘 {courseName}</h1>

        {/* Course Outcomes Section */}
        <div className="section">
          <h2 className="section-title">📌 Course Outcomes</h2>
          <div className="co-grid">
            {courseDetails.co.map((co, i) => (
              <div key={i} className="co-box">
                <h3>{co.name}</h3>
                <p>{co.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Textbooks Section */}
        <div className="section">
          <h2 className="section-title">📖 Textbooks</h2>
          <ul className="styled-list">
            {courseDetails.textbooks.map((book, i) => (
              <li key={i} className="styled-list-item">
                📚 {book}
              </li>
            ))}
          </ul>
        </div>

        {/* References Section */}
        <div className="section">
          <h2 className="section-title">🔍 References</h2>
          <ul className="styled-list">
            {courseDetails.references.map((ref, i) => (
              <li key={i} className="styled-list-item">
                📖 {ref}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailsPage;
