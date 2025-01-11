import React, { useState } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [facultyUsername, setFacultyUsername] = useState(""); // State for faculty login
    const [facultyPassword, setFacultyPassword] = useState(""); // State for faculty login
    const navigate = useNavigate();

    // Handle student login
    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedUsername = username.trim().toLowerCase();
        const trimmedPassword = password.trim().toLowerCase();

        console.log("Trimmed Username:", trimmedUsername);
        console.log("Trimmed Password:", trimmedPassword);

        // Check the condition with the trimmed and case-normalized values for student
        if (trimmedUsername === "vivekanand" && trimmedPassword === "vivek") {
            // navigate("/Syllabus");
            navigate("/semInfo");
        } else {
            alert("Incorrect username or password!");
        }
    };

    // Handle faculty login
    const handleFacultyLogin = (e) => {
        e.preventDefault();

        const trimmedFacultyUsername = facultyUsername.trim().toLowerCase();
        const trimmedFacultyPassword = facultyPassword.trim().toLowerCase();

        console.log("Trimmed Faculty Username:", trimmedFacultyUsername);
        console.log("Trimmed Faculty Password:", trimmedFacultyPassword);

        // Check the condition with the trimmed and case-normalized values for faculty
        if (trimmedFacultyUsername === "yyyy" && trimmedFacultyPassword === "yyyy") {
            alert("Faculty Login Successful! Redirecting to Faculty Dashboard...");
            navigate("/Faculty");
            // You can add navigation to the faculty dashboard here if needed
        } else {
            alert("Incorrect faculty username or password!");
        }
    };

    return (
        <div className="home-container">
            <h1 className="titlepagehome">Sign In</h1>
            
            {/* Student Login Form */}
            <form onSubmit={handleSubmit} className="login-form">
                <div className="input-group">
                    <label htmlFor="username">Admin username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Admin password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" className="login-button">Sign In</button>
            </form>

            {/* Faculty Login Form */}
            <div className="faculty-login">
                <h2>Faculty Login</h2>
                <form onSubmit={handleFacultyLogin} className="login-form">
                    <div className="input-group">
                        <label htmlFor="faculty-username">Faculty Username</label>
                        <input
                            type="text"
                            id="faculty-username"
                            name="faculty-username"
                            value={facultyUsername}
                            onChange={(e) => setFacultyUsername(e.target.value)}
                            placeholder="Enter faculty username"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="faculty-password">Password</label>
                        <input
                            type="password"
                            id="faculty-password"
                            name="faculty-password"
                            value={facultyPassword}
                            onChange={(e) => setFacultyPassword(e.target.value)}
                            placeholder="Enter faculty password"
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Faculty Sign In</button>
                </form>
            </div>

            {/* Link to faculty login page if needed */}
            <div className="faculty-login">
                <a href="/faculty-login" className="faculty-link">Login for Faculty Sign In</a>
            </div>
        </div>
    );
}

export default Home;

