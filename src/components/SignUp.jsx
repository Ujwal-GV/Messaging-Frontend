import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";

const SignUp = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const registerUser = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) return alert("Name, Email and Password are required");
        try {
            const response = await axios.post(
                "http://localhost:3000/user/register",
                { name, email, password },
                { withCredentials: true }
            );
            console.log(response.data);
            
            if(response?.data) {
                localStorage.setItem("auth_token", token);
                navigate("/main");
            }
        } catch (error) {     
            console.log(error);
                   
            const message = error?.response?.data?.message;
            toast.error(message);
        }
    };

    const handleLogin = () => {
        navigate('/');
    }

    return (
        <div className="text-center">
            <h1 className="text-2xl mb-4">Register</h1>
            <input
                className="w-full p-3 mb-3 border border-gray-300 rounded"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                className="w-full p-3 mb-3 border border-gray-300 rounded"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex items-center">
                <input
                className="w-full p-3 mb-3 border border-gray-300 rounded"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <FaEye />
            </div>
            <button
                className="w-full p-3 text-white bg-blue-500 rounded"
                onClick={registerUser}
            >
                Register
            </button>
            <button onClick={handleLogin}>Login</button>
        </div>
    );
};

export default SignUp;
