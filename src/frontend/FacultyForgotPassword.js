import React, { useState } from "react";
import axios from "axios";
import "../styles/Login.css";

function FacultyForgotPassword() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    reset_ans: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetQn, setResetQn] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFindUser = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    try {
      const res = await axios.post("http://localhost:4000/api/faculty/findUser", {
        username: formData.username.trim(),
        email: formData.email.trim(),
      });

      if (res.data.success) {
        setResetQn(res.data.reset_qn);
        setStep(2);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Error finding user. Try again.");
    }
  };

  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    try {
      const res = await axios.post("http://localhost:4000/api/faculty/verifyAnswer", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        reset_ans: formData.reset_ans.trim(),
      });

      if (res.data.success) {
        setStep(3);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Error verifying answer.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.post("http://localhost:4000/api/faculty/updatePassword", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        newPassword: formData.newPassword,
      });

      if (res.data.success) {
        setMessage("Password updated successfully! Please login.");
        setStep(4);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Error updating password.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form">
        <h1 className="login-title">Forgot Password</h1>

        {step === 1 && (
          <>
            <div className="input-group">
              <label>Username</label>
              <input type="text" name="username" onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" name="email" onChange={handleChange} />
            </div>
            <button className="login-button" onClick={handleFindUser}>Next</button>
          </>
        )}

        {step === 2 && (
          <>
            <p><strong>Security Question:</strong> {resetQn}</p>
            <div className="input-group">
              <label>Answer</label>
              <input type="text" name="reset_ans" onChange={handleChange} />
            </div>
            <button className="login-button" onClick={handleVerifyAnswer}>Verify</button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="input-group">
              <label>New Password</label>
              <input type="password" name="newPassword" onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" onChange={handleChange} />
            </div>
            <button className="login-button" onClick={handleUpdatePassword}>Update Password</button>
          </>
        )}

        {step === 4 && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

export default FacultyForgotPassword;
