import React from 'react';
import "../styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <ul className="navbar-menu">
          <li><a href="/">Login</a></li>
          <li><a href="/semInfo">Sem Info</a></li>
          <li><a href="/syllabus">Courses</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;