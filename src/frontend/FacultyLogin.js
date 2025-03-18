import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

function FacultyLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:4000/api/faculty/facultyLogin",
        {
          username: username.trim(),
          password: password.trim(), // Include password in the request
        }
      );
      console.log(response);
      if (response.data.success) {
        localStorage.setItem("facultyName", response.data.facultyName); // Store name for later use
        navigate("/Faculty");
      } else {
        setError("Incorrect username or password!");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1 className="login-title">Faculty Sign In</h1>
        <div className="input-group">
          <label htmlFor="username">Faculty Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter faculty username"
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" className="login-button">
          Sign In
        </button>
        <div className="login-footer">
          <button
            type="button"
            className="admin-link"
            onClick={() => navigate("/")}
          >
            Admin Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default FacultyLogin;
