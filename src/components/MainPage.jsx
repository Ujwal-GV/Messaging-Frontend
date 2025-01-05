import React, { useEffect, useState } from "react";
import axios from "axios";
import AuthPage from "../components/AuthPage";
import GroupManager from "../components/GroupManager";
import ChatRoom from "../components/ChatRoom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MainPage() {
    const queryClient = useQueryClient();
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [userId, setUserId] = useState(null);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [isGroupVisible, setIsGroupVisible] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
          toast.error("Session expired. Please login again.");
          navigate("/", { replace: true });
        }
      }, [token, navigate]);

    const fetchUserDetails = async () => {
        const { data } = await axios.get("http://localhost:3000/user/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return data;
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ["fetch-user"],
        queryFn: fetchUserDetails,
        staleTime: Infinity,
        gcTime: Infinity,
        enabled: !!token,
        onSuccess: (response) => setUserId(response.user.userId),
    });

    useEffect(() => {
        if (data) setUserId(data.user.userId);
    }, [data]);

    if (!token) return <AuthPage setToken={setToken} />;
    if (isLoading) return <div>Loading user data...</div>;
    if (isError) return <div>Error fetching user data</div>;

    return (
        <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-[20%,1fr]">
            {/* Sidebar */}
            <div
                className={`bg-gray-100 border-r ${
                    isGroupVisible ? "hidden" : "block"
                } lg:block`}
            >
                <GroupManager
                    userId={userId}
                    setCurrentGroup={(group) => {
                        setCurrentGroup(group);
                        setIsGroupVisible(true);
                    }}
                />
            </div>

            {/* Chat Area */}
            <div
                className={`${
                    isGroupVisible ? "block" : "hidden"
                } lg:block bg-white`}
            >
                {currentGroup ? (
                    <ChatRoom
                        group={currentGroup}
                        userId={userId}
                        setCurrentGroup={() => {
                            setCurrentGroup(null);
                            setIsGroupVisible(false);
                        }}
                    />
                ) : (
                    <div className="flex justify-center items-center h-full text-gray-500">
                        <span>Select a group to start chatting</span>
                    </div>
                )}
            </div>
        </div>
    );
}
