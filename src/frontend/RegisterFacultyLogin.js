import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/FacultyLogin.css"; 

function FacultyRegister() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    reset_qn: "",
    reset_ans: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:4000/api/faculty/facultyRegister",
        formData
      );

      if (response.data.success) {
        alert("Registration successful! Please login.");
        navigate("/faculty-login");
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Registration failed. Try again.");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1 className="login-title">Faculty Register</h1>

        <div className="input-group">
          <label>Username</label>
          <input type="text" name="username" required onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input type="email" name="email" required onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            required
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            required
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label>Reset Question</label>
          <input type="text" name="reset_qn" required onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Reset Answer</label>
          <input
            type="text"
            name="reset_ans"
            required
            onChange={handleChange}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" className="login-button">
          Register
        </button>
        <div className="login-footer">
          <button
            type="button"
            className="faculty-link"
            onClick={() => navigate("/faculty-login")}
          >
            Already have an account? Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default FacultyRegister;
