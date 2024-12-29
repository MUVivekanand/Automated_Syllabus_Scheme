import React, { useState } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate=useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedUsername = username.trim().toLowerCase();
        const trimmedPassword = password.trim().toLowerCase();

        console.log("Trimmed Username:", trimmedUsername);
        console.log("Trimmed Password:", trimmedPassword);

        // Check the condition with the trimmed and case-normalized values
        if (trimmedUsername === "vivekanand" && trimmedPassword === "vivek") {
            navigate("/Syllabus");
        } else {
            alert("Incorrect username or password!");
        }
    };

    return (
        <div className="home-container">
            <h1 className="titlepagehome">Sign In</h1>
            <form onSubmit={handleSubmit} className="login-form">
                <div className="input-group">
                    <label htmlFor="username">Username</label>
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
                    <label htmlFor="password">Password</label>
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
            <div className="faculty-login">
                <a href="/faculty-login" className="faculty-link">Login for Faculty Sign In</a>
            </div>
        </div>
    );
}

export default Home;
