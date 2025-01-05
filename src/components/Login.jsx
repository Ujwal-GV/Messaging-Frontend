import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [visible, setvisible] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) return alert("Email and password are required");
        try {
            const response = await axios.post(
                "http://localhost:3000/user/login",
                { email, password },
                { withCredentials: true }
            );
    
            console.log(response?.data);
            
            const token = response.data.token;
            localStorage.setItem("auth_token", token);
    
            navigate("/main");
        } catch (error) {
            console.log(error);
            
            const message = error?.response?.data?.message || "Something went wrong";
            toast.error(message);
        }
    };
    

    const handleSignUp = () => {
        navigate('/signup');
    }

    const handleVisibility = () => {
        setvisible(!visible);
    } 

    return (
        <div className="text-center">
            <h1 className="text-2xl mb-4">Login</h1>
            <input
                className="w-full p-3 mb-3 border border-gray-300 rounded"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex items-center relative center">
                <input
                    className="w-full p-3 mb-3 border border-gray-300 rounded relative"
                    placeholder="Password"
                    type={visible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button className=" absolute right-3" onClick={handleVisibility}>
                    {visible ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
            <button
                className="w-full p-3 text-white bg-blue-500 rounded"
                onClick={handleLogin}
            >
                Login
            </button>
            <button onClick={handleSignUp}>Register</button>
        </div>
    );
};

export default Login;
