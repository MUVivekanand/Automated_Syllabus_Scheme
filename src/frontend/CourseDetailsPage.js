import React from "react";
import { useLocation } from "react-router-dom";
import "../styles/CourseDetailsPage.css"; // Import updated styles

function CourseDetailsPage() {
  const location = useLocation();
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
    </div>
  );
}

export default CourseDetailsPage;
