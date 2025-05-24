import React from "react"
import { useState, useEffect } from "react"
import 'tailwindcss/tailwind.css'
import axios from "axios"

import StandardToolBar from "./menus/standardToolBar"
// import QuickVideos from "./create-components.js/quickVideos" // Commented out as per previous step, ensure it's not needed or update its usage
import Link from 'next/link'; // Import Link component
import { set } from "mongoose"


export default function Create() {
    // react component to create a new room
    // get the room code from the server and redirect the user to the room
    const [room, setRoom] = useState("");
    const [notification, setNotification] = useState(false);
    const [token, setToken] = useState(''); // This state is declared but not used. Consider removal if not needed.
    const [myRegisteredVideos, setMyRegisteredVideos] = useState([]);
    const [selectedVideoIds, setSelectedVideoIds] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [errorVideos, setErrorVideos] = useState('');

    useEffect(() => {
        setLoadingVideos(true);
        setErrorVideos('');
        axios.get('/api/videos/my-local-streams', { withCredentials: true })
            .then(res => {
                setMyRegisteredVideos(res.data || []);
                setLoadingVideos(false);
            })
            .catch(err => {
                console.error("Error fetching registered videos:", err);
                setErrorVideos('Failed to fetch your registered videos. Please try again later.');
                setLoadingVideos(false);
            });
    }, []);
    
    const showNotification = () => {
        setNotification(true);
        setTimeout(() => {
          setNotification(false);
        }, 3000); // Reduced timeout for quicker feedback
        // return; // Not necessary to return here
    };

    const handleVideoSelection = (videoId) => {
        setSelectedVideoIds(prevSelectedVideoIds => {
            if (prevSelectedVideoIds.includes(videoId)) {
                return prevSelectedVideoIds.filter(id => id !== videoId);
            } else {
                return [...prevSelectedVideoIds, videoId];
            }
        });
    };

    async function getRoom() {
        const roomNameInput = document.getElementById('room-name');
        if (!roomNameInput || !roomNameInput.value.trim()) {
            alert("Please enter a room name."); // Simple validation
            return;
        }
        const roomName = roomNameInput.value.trim();
        
        const roomData = {
            name: roomName,
            roomVideos: selectedVideoIds // Include selected video IDs
        };

        try {
            const res = await axios.post('/api/room', roomData, { withCredentials: true });
            let roomDetails = res.data;
            let roomCode = roomDetails.roomCode;
            let roomUrl = roomDetails.roomUrl;
            setRoom(roomDetails); // Though room state is set, it's not actively used before redirect.
            navigator.clipboard.writeText(roomCode)
                .then(() => showNotification())
                .catch(err => console.error('Failed to copy room code:', err)); // Handle clipboard error

            //delay redirect to allow time for notification to show
            setTimeout(() => {
                window.location.href = `/watch?room=${roomUrl}`;
            }, 3000);
        } catch (err) {
            console.error("Error creating room:", err);
            // Potentially set an error state here to show to the user
            alert("Failed to create room. Please try again.");
        }
    }

    return (
        <div>
            <StandardToolBar/>
            {notification && <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-3 rounded shadow-lg z-50">Room code copied to clipboard!</div>}
            <div className="min-h-screen flex flex-col items-center bg-gray-900 text-white pt-20"> {/* Added pt-20 for toolbar spacing */}
                <div className="w-full max-w-2xl p-4"> {/* Constrained width and added padding */}
                    <form className="flex flex-col sm:flex-row justify-center mb-6">
                        <input id="room-name" type="text" placeholder="Enter Room Name" className="rounded-lg p-3 text-black mr-0 sm:mr-2 mb-2 sm:mb-0 flex-grow w-full sm:w-2/3"/>
                        <button className="rounded-lg p-3 bg-blue-600 text-white hover:bg-blue-700 transition duration-150 w-full sm:w-auto" onClick={(e)=>{
                            e.preventDefault();
                            getRoom();
                        }}>Create Room</button>
                    </form>
                    
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">Select Videos for the Room:</h2>
                        {loadingVideos && <p className="text-gray-400">Loading your videos...</p>}
                        {errorVideos && <p className="text-red-500">{errorVideos}</p>}
                        {!loadingVideos && !errorVideos && myRegisteredVideos.length === 0 && (
                            <p className="text-gray-400">
                                You haven't registered any local videos yet. Go to{' '}
                                <Link href='/my-local-streams'>
                                    <a className="text-blue-400 hover:text-blue-300 underline">My Local Streams</a>
                                </Link>
                                {' '}to add videos from your computer.
                            </p>
                        )}
                        {!loadingVideos && !errorVideos && myRegisteredVideos.length > 0 && (
                            <ul className="bg-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
                                {myRegisteredVideos.map(video => (
                                    <li key={video._id} className="flex items-center p-2 hover:bg-gray-700 rounded">
                                        <input
                                            type="checkbox"
                                            id={`video-${video._id}`}
                                            checked={selectedVideoIds.includes(video._id)}
                                            onChange={() => handleVideoSelection(video._id)}
                                            className="mr-3 h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 ring-offset-gray-800 focus:ring-2"
                                        />
                                        <label htmlFor={`video-${video._id}`} className="cursor-pointer flex-grow">
                                            {video.videoName}
                                            {video.isPubliclyAccessible === false && (
                                                <span className="text-xs text-gray-400 ml-2">(Local only)</span>
                                            )}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="flex flex-col mt-4 text-center text-gray-400">
                        <span>
                            Create a room and share the room code with your friends to watch videos together.
                        </span>
                        <span>
                            You can also select your registered local streams to add them to the room's playlist.
                        </span>
                    </div>
                </div>
                {/* QuickVideos component might need review if it's still relevant or needs to interact with the new video list */}
                {/* <QuickVideos/> */}
            </div>
        </div>
    )
}