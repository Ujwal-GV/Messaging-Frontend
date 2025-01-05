import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { FaArrowLeft, FaCheck, FaCheckDouble, FaCross, FaTrash, FaUser } from "react-icons/fa";
import { FaHandDots, FaUserGroup } from "react-icons/fa6";
import toast, { LoaderIcon } from "react-hot-toast";
import { CgClose } from "react-icons/cg";
import { useMutation, useQuery } from "@tanstack/react-query";

const ChatRoom = ({ group, userId, setCurrentGroup }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [typing, setTyping] = useState("");
    const [socket, setSocket] = useState(null);
    const [groupId, setGroupId] = useState("");
    const [image, setImage] = useState(null);
    const [openChatClear, setOpenChatClear] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [openGroupDetailsModal, setOpenGroupDetailsModal] = useState(false);

    useEffect(() => {
        if (userId) {
            const socketInstance = io("http://localhost:3000", {
                query: { userId },
            });
            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        }
    }, [userId]);

    const fetchMessages = async (groupId) => {
        try {
            const response = await axios.get(`http://localhost:3000/group/${groupId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    useEffect(() => {
        if (group?.groupId && socket) {
            fetchMessages(group.groupId);
            socket.emit("join-group", group.groupId);

            socket.on("receive-message", (newMessage) => {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                socket.emit("deliver-message", newMessage._id, userId, group.groupId);
            });

            return () => {
                socket.emit("leave-group", group.groupId);
                socket.off("receive-message");
                socket.off("message-status");
            };
        }
    }, [group?.groupId, userId, socket]);

    useEffect(() => {
        if (socket) {
            socket.on("user-typing", ({ name, userId: typingUserId, isTyping }) => {
                if (typingUserId !== userId) {
                    setTyping(isTyping ? `${name} is typing....` : "");
                }
            });

            return () => {
                socket.off("user-typing");
            };
        }
    }, [socket, userId]);

    useEffect(() => {
        const chatContainer = document.querySelector(".flex-grow");
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, [messages]);

    const sendMessage = () => {
        if (message.trim()) {
            const newMessage = {
                groupId: group.groupId,
                sender: userId,
                content: message.trim(),
                status: "sent",
                timestamp: new Date().toISOString(),
            };

            socket.emit("send-message", newMessage, (error) => {
                if (error) {
                    console.error("Error sending message:", error);
                }
            });

            setMessage("");
        }
    };

    const handleTyping = () => {
        socket.emit("user-typing", { groupId: group.groupId, userId, isTyping: true });
        setTimeout(() => {
            socket.emit("user-typing", { groupId: group.groupId, userId, isTyping: false });
        }, 2000);
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "Unknown Time";
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const deleteChat= async () => {
        try {
            const res = await axios.post(`http://localhost:3000/group/clear-chat/${groupId}`);
            if (res) {
                toast.success(res?.data?.message);
                fetchMessages(groupId);
            }
        } catch (error) {
            console.log(error);
            
            const message = error?.response?.data?.message;
            toast.error(message || "Error clearing chats");
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/group/get-all-users/${group?.groupId}`);
            console.log("Response", res.data.groupData.Group_data);
            return res.data.groupData.Group_data;
        } catch (error) {
            const message = error?.response?.data?.message;
            toast.error(message || "Failed to fetch group members");
        }
    };

    const {
        data: usersData = [],
        isLoading: usersDataLoading,
        isFetching: usersDataFetching,
        isError: usersDataError,
    } = useQuery({
        queryKey: ['group-data'],
        queryFn: fetchAllUsers,
        staleTime: 0,
        cacheTime: 0,
    });

    const updateGroupData = async (formData) => {
        try {
            const res = await axios.put(`http://localhost:3000/group/${group?.groupId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("Image response", res.data);
            
            return res.data;
        } catch (error) {
            console.log("ERR", error);
            console.error("Error updating user:", error);
        }
    };

    const { mutate, isLoading, isPending, isError } = useMutation({
        mutationKey: ['update-group-data'],
        mutationFn: updateGroupData,
        onSuccess: (data) => {
            // const updatedImage = `${data?.updatedGroup?.image}?t=${new Date().getTime()}`;
            // if(updatedImage) {
            //     setImage(updatedImage);
            // } else {
            //     setImage("Profile");
            // }
            // toast.success("Group profile updated");
            toast.success("Group profile updated successfully!");
            setImage(`${data?.updatedGroup?.image}?t=${new Date().getTime()}`);
            setImagePreview(null);
        },
        onError: (error) => {
            console.log(error);
            toast.error(error?.message);
        }
    })

    const handleSaveGroupData = async () => {
        const formData = new FormData();
        if (image) {
            formData.append("image", image);
        }
        mutate(formData);
    };

    const handleClearChat = (groupId) => {
        setOpenChatClear(true);
        setGroupId(groupId);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100 relative">
            {/* Delete Confirmation Modal */}

            {openChatClear && (
                <div 
                    className="absolute inset-0 bg-black bg-opacity-50 text-xs flex items-center justify-center z-20"
                    onClick={() => setOpenChatClear(false)}
                >
                    <div 
                        className="bg-white p-6 rounded-lg shadow-lg w-80 mx-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to clear the messages? This action cannot
                            be undone.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setOpenChatClear(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteChat();
                                    setOpenChatClear(false);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {openGroupDetailsModal && (
                <div 

                    className="absolute w-full bg-black bg-opacity-50 text-xs flex items-center justify-center z-20"
                    onClick={() => setOpenGroupDetailsModal(false)}
                >
                    <div 
                        className="bg-white shadow-lg w-full min-h-screen h-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-[1.5rem] font-bold text-white uppercase bg-green-600 px-4 py-8">Group Details</h2>
                        <div className="flex flex-col items-center lg:flex-row md:flex-row p-10 text-lg lg:gap-[10rem] md:gap-[10rem] relative">
                            <span className="lg:justify-start w-[10rem] h-[10rem] lg:h-[15rem] md:h-[15rem] lg:w-[15rem] md:w-[15rem] mb-2 items-center">
                                {/* <img 
                                    src={group.image}
                                    alt="img"
                                    className="rounded-full border border-black lg:mt-10 md:mt-10"
                                /> */}
                                <div className="flex flex-col items-center gap-4 lg:mt-[2.2rem]">
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Profile Preview"
                                                className="w-40 h-40 rounded-full border-2 object-cover"
                                            />
                                        ) : group?.image ? (
                                            <img
                                                src={group?.image}
                                                alt="Profile"
                                                className="w-40 h-40 rounded-full object-cover border-2"
                                            />
                                        ) : (
                                            <div className="w-40 h-40 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
                                                <FaUser size={48} />
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        type="file"
                                        id="image-upload"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setImage(file);
                                                setImagePreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    {image && (
                                        <button
                                            className="absolute bottom-[14rem] left-[11rem] bg-red-500 text-white rounded-full p-1 border-2"
                                            onClick={() => {
                                                setImage(null);
                                                setImagePreview(null);
                                            }}
                                        >
                                            <FaTrash size={13} />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSaveGroupData}
                                        disabled={isLoading}
                                        className={`text-xs px-2 py-1 lg:px-3 lg:py-2 lg:text-sm md:text-sm text-white rounded-md ${
                                            isLoading
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-green-600 hover:bg-green-700"
                                        }`}
                                    >
                                        {isLoading || isPending ? (
                                            <span className="flex items-center gap-2">
                                                Saving <LoaderIcon />
                                            </span>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                    </div>
                                </span>
                                                        
                            <div className="lg:justify-center mt-6 lg:mt-0 md:mt-0 w-full flex flex-col items-center">
                                <p className="mb-3 mt-3 text-sm lg:text-lg md:text-lg font-bold">
                                    {group?.name}
                                </p>
                                <p className="lg:mb-3 flex gap-2 items-center text-sm lg:text-lg md:text-lg font-bold">
                                    <FaUserGroup /> {group?.members.length} members
                                </p>
                                <p className="lg:mb-3 text-[0.6rem] lg:text-xs md:text-xs">
                                    Created at: {new Date(group?.createdAt).toLocaleString()}
                                </p>
                                <p className="lg:mb-3 text-[0.6rem] lg:text-xs md:text-xs">
                                    Group ID: {group?.groupId}
                                </p>
                            </div>
                            <div className="absolute right-5 top-5 justify-end">
                                <button
                                    onClick={() => setOpenGroupDetailsModal(false)}
                                    className="bg-gray-200 p-2 text-gray-800 border border-gray-700 shadow-md rounded-full hover:bg-gray-300"
                                >
                                    <CgClose className="text-lg font-bold font-black" />
                                </button>
                            </div>
                        </div>
                        <div className="mx-2 rounded-lg p-3 h-10 shadow-lg overflow-y-auto custom-scroll min-h-[30rem]">
                            <h1 className="text-[1.2rem] uppercase m-3 font-black">Members</h1>
                            <div className="relative w-full mb-4">
                                <FaUser className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Members"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-md"
                                />
                            </div>
                            {
                                usersDataLoading || usersDataFetching ? (
                                    <p>Loading....</p>
                                ) : 
                                usersData
                                .filter((user) =>
                                    user.name.toLowerCase().includes(searchTerm)
                                )
                                .map((user) => (
                                    <div
                                        key={user._id}
                                        className="flex flex-row gap-3 items-center mb-4 w-full bg-gray-200 hover:bg-gray-100 hover:cursor-pointer rounded-lg p-2"
                                    >
                                        <span>
                                            <img
                                                src={
                                                    user.image ||
                                                    <FaUser className="text-gray-200 bg-gray-800" />
                                                }
                                                className="w-10 h-10 rounded-full border-2 border-gray-300"
                                            />
                                        </span>
                                        <div className="flex flex-col gap-0">
                                            <span className="font-semibold">
                                                {user.name}
                                            </span>
                                            <span className="text-[0.6rem] text-gray-700">
                                                {user.description}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Header */}
            <div className="w-full bg-white shadow-md flex items-center justify-between px-4 py-6 fixed top-0 z-10">
                <button
                    onClick={() => setCurrentGroup(null)}
                    className="p-2 text-gray-700 hover:bg-gray-200 rounded-full"
                >
                    <FaArrowLeft className="text-sm" />
                </button>
                <span
                    className="absolute flex items-center left-[3.5rem] gap-4 cursor-pointer"
                    onClick={() => setOpenGroupDetailsModal(true)}
                >                    
                    <img 
                        src={group.image} 
                        alt="img"
                        className="w-12 h-12 rounded-full border border-black"
                    />
                    <h1 className="text-xl lg:text-2xl font-black">{group.name}</h1>
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClearChat(group?.groupId);
                    }}
                >
                    <FaTrash className="text-xs text-gray-500" />
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto mt-16 p-4 bg-white shadow-md custom-scroll">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${
                            msg?.sender?.userId === userId ? "justify-end" : "justify-start"
                        } mb-3`}
                    >
                        <div
                            className={`px-2 min-w-[20%] rounded-lg ${
                                msg?.sender?.userId === userId ? "bg-green-200" : "bg-gray-200"
                            }`}
                        >
                            <strong className="text-xs">
                                {msg?.sender?.userId === userId ? "You" : msg?.sender?.name}:
                            </strong>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-[0.5rem] text-gray-500 mt-1 flex justify-end">
                                {formatTimestamp(msg.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}
                {typing && (
                    <span className="flex justify-start mb-3 text-xs text-gray-500">{typing}</span>
                )}
            </div>

            {/* Chat Input */}
            <div className="flex items-center space-x-2 px-4 py-2 bg-white border-t border-gray-300 shadow-md">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        handleTyping();
                    }}
                    placeholder="Type a message"
                    className="flex-grow p-2 border border-gray-300 rounded-md"
                />
                <button
                    onClick={sendMessage}
                    className="p-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
                    disabled={!message.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatRoom;
