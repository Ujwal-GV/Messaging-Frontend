import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AuthPage = () => {
    const queryClient = useQueryClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [visible, setVisible] = useState(false);
    const [token, setToken] = useState(null);

    const navigate = useNavigate();
    
    const mutation = useMutation({
        mutationKey: ['user-login'],
        mutationFn: (payload) => {
            const endpoint = isLogin ? "login" : "register";
            return axios.post(`http://localhost:3000/user/${endpoint}`, payload);
        },
        onSuccess: (data) => {
            setToken(data.data.token);
            localStorage.setItem("token", data.data.token);
            navigate("/main");
        },
        onError: (error) => {
            const message = error?.response?.data?.message;
            toast.error(message);
            console.error("Authentication error", error.response?.data || error.message);
        },
    });

    const handleAuth = () => {
        const payload = isLogin ? { email, password } : { email, password, name };
        mutation.mutate(payload);
    };

    const handlePasswordVisibility = () => {
        setVisible(!visible);
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-200 rounded-lg shadow-md md:max-w-lg">
                <h1 className="text-2xl font-bold text-center text-gray-800 uppercase">
                    {isLogin ? "Login" : "Register"}
                    <hr className="text-black w-full border border-white my-4" />
                </h1>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAuth();
                    }}
                >
                    {!isLogin && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring focus:ring-gray-300"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring focus:ring-gray-300"
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                            <input
                                type={visible ? "text" : "password"}
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-1 border rounded-lg focus:outline-none focus:ring focus:ring-gray-300"
                            />
                            <button onClick={handlePasswordVisibility}>
                                {
                                    visible ? 
                                    <FaEyeSlash className="absolute right-3 bottom-3" /> :
                                    <FaEye className="absolute right-3 bottom-3" />
                                }
                            </button>
                    </div>
                    <button
                        type="submit"
                        disabled={mutation.isLoading}
                        className={`w-full px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-600 ${
                            mutation.isLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        {mutation.isLoading ? "Processing..." : isLogin ? "Login" : "Register"}
                    </button>
                </form>
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full px-4 py-2 text-gray-600 bg-transparent underline rounded-lg hover:text-black"
                >
                    {isLogin ? "Register" : "Login"}
                </button>
            </div>
        </div>
    );
};

export default AuthPage;
