import React from "react";
import { useLocation } from "react-router-dom";
import "../styles/CourseDetailsPage.css"; // Import updated styles

function CourseDetailsPage() {
  const location = useLocation();
  const { courseName, courseDetails } = location.state || {};

  if (!courseName) {
    return <p className="error-message">No course details found.</p>;
  }

  // ✅ Ensure textbooks and refs are at least empty arrays to avoid errors
  const textbooks = courseDetails.textbooks || [];
  const refs = courseDetails.references || [];

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
          {textbooks.length > 0 ? (
            <ul className="styled-list">
              {textbooks.map((book, i) => (
                <li key={i} className="styled-list-item">
                  📚 <b>{book.title || "Unknown Title"}</b> <br />
                  <small>
                    {book.author && `by ${book.author}, `}
                    {book.edition && `Edition: ${book.edition}, `}
                    {book.publisher && `Published by ${book.publisher}, `}
                    {book.place && `Place: ${book.place}, `}
                    {book.year && `Year: ${book.year}`}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No textbooks available.</p>
          )}
        </div>

        {/* References Section */}
        <div className="section">
          <h2 className="section-title">🔍 References</h2>
          {refs.length > 0 ? (
            <ul className="styled-list">
              {refs.map((ref, i) => (
                <li key={i} className="styled-list-item">
                  📖 <b>{ref.title || "Unknown Title"}</b> <br />
                  <small>
                    {ref.author && `by ${ref.author}, `}
                    {ref.edition && `Edition: ${ref.edition}, `}
                    {ref.publisher && `Published by ${ref.publisher}, `}
                    {ref.place && `Place: ${ref.place}, `}
                    {ref.year && `Year: ${ref.year}`}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No references available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetailsPage;
