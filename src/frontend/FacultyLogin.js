import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function FacultyLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedUsername = username.trim().toLowerCase();
        const trimmedPassword = password.trim().toLowerCase();

        if (trimmedUsername === "yyyy" && trimmedPassword === "yyyy") {
            navigate("/Faculty");
        } else {
            alert("Incorrect username or password!");
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
                <button type="submit" className="login-button">Sign In</button>
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