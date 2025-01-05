import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { FaPlus, FaUser, FaTrash } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast, { LoaderIcon } from "react-hot-toast";
import { LuLogOut } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

const GroupManager = ({ userId, setCurrentGroup }) => {
    const [groupName, setGroupName] = useState("");
    const [groupId, setGroupId] = useState("");
    const [groups, setGroups] = useState([]);
    const [socket, setSocket] = useState(null);
    const [newGroup, setNewGroup] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [current, setCurrent] = useState("");

    const navigate = useNavigate();
    const queryClient = useQueryClient();

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

    const fetchGroups = async () => {
        const res = await axios.get("http://localhost:3000/group/groups");        
        return res.data.groups;
    };

    const { 
        data: groupsData = [], 
        refetch: groupsRefetch 
    } = useQuery({
        queryKey: ['groups'],
        queryFn: fetchGroups
    });

    const createGroup = async () => {
        if (groupName.trim()) {
            try {
                const { data } = await axios.post("http://localhost:3000/group/create-group", {
                    name: groupName,
                });
                setGroups((prevGroups) => [...prevGroups, data.group]);
                setNewGroup(false);
                setGroupName("");
                groupsRefetch();
            } catch (error) {
                console.error("Error creating group", error);
            }
        }
    };

    const fetchUser = async () => {
        const res = await axios.get(`http://localhost:3000/user/get-user/${userId}`);
        setName(res.data.user.name);
        setImage(res.data.user.image);
        setEmail(res.data.user.email);
        setDescription(res.data.user.description);
        
        return res.data.user;
    };

    const { data: userData, refetch, isFetching, isLoading } = useQuery({
        queryKey: ["user-info"],
        queryFn: fetchUser,
        staleTime: 0,
        cacheTime: 0,
        enabled: false,
    });

    const updateUserData = async () => {
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            if (image) {
                formData.append("image", image);
            }

            const res = await axios.put(`http://localhost:3000/user/${userId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setOpenProfile(false);
            return res.data;
        } catch (error) {
            console.log(error);
            
            console.error("Error updating user:", error);
        }
    };

    const mutation = useMutation({
        mutationKey: ['update-user'],
        mutationFn: updateUserData,
        onSuccess: (data) => {
            const updatedImage = `${data?.updatedUser?.image}?t=${new Date().getTime()}`;
            if(updatedImage) {
                setImage(updatedImage);
            } else {
                setImage("Profile");
            }
            toast.success("User profile updated");
        },
        onError: (error) => {
            toast.error(error?.message);
        }
    })

    const saveUserData = async () => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        if (image) {
            formData.append("image", image);
        }
        mutation.mutate(formData);
    };

    const deleteImage = () => {
        setImage(null);
    };

    const joinGroup = (group) => {
        setCurrentGroup(group);
        if (socket) {
            socket.emit("join-group", group.groupId);
        }
    };

    const handleNewChat = () => {
        setNewGroup(!newGroup);
    };

    const handleProfileView = () => {
        setOpenProfile(!openProfile);
        if (!openProfile) {
            refetch();
        }
    };

    const handleLogout = () => {
        queryClient.clear();
        localStorage.clear();
        sessionStorage.clear();
        toast.success("Logged out");
        navigate("/");
    }

    useEffect(() => {
        if (userData) {
            setName(userData.name);
            setDescription(userData.description);
            setImage(userData.image);
        }
    }, [userData]);

    const deleteGroup = async () => {
        try {
            const res = await axios.delete(`http://localhost:3000/group/${groupId}`);
            if (res) {
                toast.success(res?.data?.message);
                groupsRefetch();
                setCurrentGroup(null);
            }
        } catch (error) {
            console.log(error);
            
            const message = error?.response?.data?.message;
            toast.error(message || "Error deleting group");
        }
    };

    const handleGroupDelete = (groupId, groupName) => {
        setOpenDeleteModal(true);
        setGroupId(groupId);
        setCurrent(groupName);
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {openDeleteModal && (
                <div 
                    className="absolute inset-0 bg-black bg-opacity-50 text-xs flex items-center justify-center z-20"
                    onClick={() => setOpenDeleteModal(false)}
                >
                    <div 
                        className="bg-white p-6 rounded-lg shadow-lg w-80 mx-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete the group <strong>{current}</strong> ? This action cannot
                            be undone.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setOpenDeleteModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteGroup();
                                    setOpenDeleteModal(false);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="px-4 py-5 bg-green-600 flex flex-col items-center relative">
                <div className="grid grid-cols-2 items-center w-full">
                    <span className="flex justify-start text-white text-lg font-bold text-[1.5rem]">CHATS</span>
                    <span className="flex justify-end space-x-2">
                        <button className="p-3 hover:bg-green-700 rounded-full" onClick={handleNewChat}>
                            <FaPlus className="text-white" />
                        </button>
                        <button className="p-3 hover:bg-green-700 rounded-full" onClick={handleProfileView}>
                            <FaUser className="text-white" />
                        </button>
                        <button className="p-3 hover:bg-green-700 rounded-full" onClick={handleLogout}>
                            <LuLogOut className="text-white" />
                        </button>
                    </span>
                </div>

                {/* Group creation form */}
                {newGroup && (
                    <div className="px-4 py-3 mt-4 w-full">
                        <div className="flex flex-col lg:flex-row gap-4 items-center">
                            <input
                                type="text"
                                placeholder="Group name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="px-4 py-2 w-full lg:w-3/4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            />
                            <button
                                onClick={createGroup}
                                className="px-4 py-2 text-white center bg-green-600 rounded-md hover:bg-green-700 shadow-md"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile section */}
            {openProfile && (
                <div className="absolute top-20 h-[46.5rem] px-4 py-5 w-full bg-gray-200 overflow-y-auto z-50">
                    {isLoading || isFetching ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="flex flex-col gap-4 items-center">
                            <div className="relative">
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Profile Preview"
                                            className="w-32 h-32 rounded-full object-cover"
                                        />
                                    ) : image ? (
                                        <img
                                            src={image}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
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
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        onClick={() => {
                                            setImage(null);
                                            setImagePreview(null);
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>

                            <span className="w-full flex flex-col justify-start gap-0 relative">
                                <span>Name</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="p-2 w-full rounded-lg border border-gray-500"
                                />
                            </span>

                            <span className="w-full flex flex-col justify-start gap-0 relative">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={email}
                                    disabled={true}
                                    className="p-2 w-full rounded-lg border border-gray-500"
                                />
                            </span>

                            <span className="w-full flex flex-col justify-start gap-0 relative">
                                <span>Description</span>
                                <textarea
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="p-2 w-full rounded-lg border border-gray-500"
                                />
                            </span>

                            <button
                                onClick={saveUserData}
                                className="px-4 py-2 w-full lg:w-1/4 text-white bg-green-600 rounded-md hover:bg-green-700"
                            >
                                {
                                    mutation.isPending ? 
                                    <span className="flex justify-center center gap-2 items-center">
                                        Updating<LoaderIcon />
                                    </span> : "Save"
                                }
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Group list */}
            <div className="flex-1 overflow-y-auto custom-scroll px-0 py-4 relative">
                {groupsData.length > 0 ? (
                    groupsData.map((group) => (
                        <div
                            key={group.groupId}
                            onClick={() => joinGroup(group)}
                            className="relative flex items-center gap-4 px-2 py-6 m-2 bg-white cursor-pointer hover:bg-gray-100 hover:rounded-md"
                        >
                            <div className="rounded-full">
                                <img 
                                    src={group.image} 
                                    alt="img"
                                    className="w-12 h-12 rounded-full border border-black"
                                 />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-md font-semibold text-gray-800">{group.name}</h3>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleGroupDelete(group?.groupId, group?.name);
                                }}
                                className="absolute right-0"
                            >
                                <FaTrash className="text-xs text-gray-500" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 h-full w-full flex justify-center items-center text-xs">
                        <span>
                            Create groups to chat
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupManager;
