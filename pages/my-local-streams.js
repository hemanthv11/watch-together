import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import StandardToolBar from './menus/standardToolBar'; // Assuming the path is correct
import 'tailwindcss/tailwind.css'; // Ensure Tailwind is imported

const MyLocalStreamsPage = () => {
    const [helperStatus, setHelperStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
    const [helperPort, setHelperPort] = useState(3000); // Default port
    const [videosFromHelper, setVideosFromHelper] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoadingVideosFromHelper, setIsLoadingVideosFromHelper] = useState(false);

    // New state variables for platform-registered videos and modal
    const [platformRegisteredVideos, setPlatformRegisteredVideos] = useState([]);
    const [isLoadingPlatformVideos, setIsLoadingPlatformVideos] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [selectedVideoForModal, setSelectedVideoForModal] = useState(null);
    const [registrationForm, setRegistrationForm] = useState({
        videoName: '',
        description: '',
        modalHelperAppPort: '', // Separate port for modal to avoid conflict
        isPubliclyAccessible: false,
    });
    const [registrationError, setRegistrationError] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState('');


    const fetchPlatformRegisteredVideos = useCallback(() => {
        setIsLoadingPlatformVideos(true);
        axios.get('/api/videos/my-local-streams', { withCredentials: true })
            .then(response => {
                setPlatformRegisteredVideos(response.data || []);
                setIsLoadingPlatformVideos(false);
            })
            .catch(error => {
                console.error("Error fetching platform registered videos:", error);
                setErrorMsg('Failed to fetch your registered streams from the platform.');
                setIsLoadingPlatformVideos(false);
            });
    }, []); // No dependencies, stable function

    useEffect(() => {
        fetchPlatformRegisteredVideos();
    }, [fetchPlatformRegisteredVideos]);


    const fetchVideosFromHelper = useCallback(() => {
        setIsLoadingVideosFromHelper(true);
        setErrorMsg(''); // Clear previous errors specific to this action
        axios.get(`http://127.0.0.1:${helperPort}/api/list-videos`)
            .then(response => {
                setVideosFromHelper(response.data || []); // Assuming helper returns an array of videos
                setIsLoadingVideosFromHelper(false);
            })
            .catch(error => {
                console.error("Error fetching videos from helper app:", error);
                setErrorMsg('Could not fetch video list from helper. Ensure it is running and accessible.');
                setVideosFromHelper([]); // Clear videos on error
                setIsLoadingVideosFromHelper(false);
            });
    }, [helperPort]);

    const checkHelperStatus = useCallback(() => {
        setHelperStatus('connecting');
        setErrorMsg('');
        axios.get(`http://127.0.0.1:${helperPort}/api/status`)
            .then(response => {
                if (response.data && response.data.status === 'ok') {
                    setHelperStatus('connected');
                } else {
                    setHelperStatus('disconnected');
                    setErrorMsg('Helper app responded but status was not OK. Check if it is running correctly.');
                }
            })
            .catch(error => {
                console.error("Error connecting to helper app:", error);
                setHelperStatus('disconnected');
                setErrorMsg('Failed to connect to helper app. Please ensure it is running on the correct port and not blocked by a firewall.');
            });
    }, [helperPort]);

    useEffect(() => {
        checkHelperStatus();
    }, [checkHelperStatus]); // Initial check on mount and when checkHelperStatus changes (due to port change)

    useEffect(() => {
        if (helperStatus === 'connected') {
            fetchVideosFromHelper();
        }
    }, [helperStatus, fetchVideosFromHelper]);

    const handleRetryConnection = () => {
        checkHelperStatus(); // Re-check status, which will trigger video fetch if successful
    };

    const handlePortInputChange = (event) => {
        const newPort = event.target.value;
        if (/^\d*$/.test(newPort) && newPort >= 0 && newPort <= 65535) {
            setHelperPort(Number(newPort));
        } else if (newPort === "") {
             setHelperPort('');
        }
    };

    const openRegisterModal = (video) => {
        setSelectedVideoForModal(video);
        setRegistrationForm({
            videoName: video.chosenName || '',
            description: '',
            // Use video.port if available from helper, otherwise default to current helperPort
            modalHelperAppPort: video.port ? String(video.port) : String(helperPort), 
            isPubliclyAccessible: false,
        });
        setRegistrationError('');
        setRegistrationSuccess('');
        setIsRegisterModalOpen(true);
    };

    const handleRegistrationFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRegistrationForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVideoForModal || !selectedVideoForModal.hlsPath) {
            setRegistrationError("Error: No video selected or HLS path is missing.");
            return;
        }

        const portToRegister = parseInt(registrationForm.modalHelperAppPort, 10);
        if (isNaN(portToRegister) || portToRegister <= 0 || portToRegister > 65535) {
            setRegistrationError("Invalid Helper App Port for registration.");
            return;
        }

        const payload = {
            videoName: registrationForm.videoName,
            description: registrationForm.description,
            localM3u8Path: selectedVideoForModal.hlsPath, // From helper video data
            helperAppPort: portToRegister,
            isPubliclyAccessible: registrationForm.isPubliclyAccessible,
            // duration: selectedVideoForModal.duration, // Optional: if helper provides duration
        };

        try {
            setRegistrationError('');
            setRegistrationSuccess('');
            await axios.post('/api/videos/register-local-stream', payload, { withCredentials: true });
            setRegistrationSuccess('Video registered successfully!');
            fetchPlatformRegisteredVideos(); // Refresh the list
            setTimeout(() => {
                setIsRegisterModalOpen(false);
                setRegistrationSuccess(''); // Clear success message after modal closes
            }, 2000); // Keep modal open for a bit to show success
        } catch (error) {
            console.error("Error registering video:", error);
            setRegistrationError(error.response?.data?.error || 'Failed to register video. Please try again.');
        }
    };
    
    const isVideoRegistered = (helperVideo) => {
        // Check if a video from helper (identified by its hlsPath and associated port) 
        // is present in platformRegisteredVideos.
        // Note: The helper video's port might be the global helperPort or specific if helper provides it.
        const currentVideoPort = helperVideo.port || helperPort;
        return platformRegisteredVideos.some(
            pVideo => pVideo.localM3u8Path === helperVideo.hlsPath && pVideo.helperAppPort === currentVideoPort
        );
    };


    return (
        <div className="min-h-screen bg-gray-100">
            <StandardToolBar />
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold text-gray-800 my-4">My Local Streams</h1>
                
                {errorMsg && !isRegisterModalOpen && <p className="text-red-500 bg-red-100 p-3 rounded my-2">{errorMsg}</p>}
                
                {helperStatus === 'connecting' && (
                    <p className="text-blue-500 text-lg my-2">Connecting to helper app on port {helperPort}...</p>
                )}

                {helperStatus === 'disconnected' && (
                    <div className="bg-white shadow-md rounded p-6 my-4">
                        <h2 className="text-2xl font-semibold text-red-600 mb-3">Helper App Disconnected</h2>
                        <p className="text-gray-700 mb-2">To share videos from your computer, you need our Local Helper App.</p>
                        <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1">
                            <li>Download the Helper App here: <a href='#' onClick={(e) => e.preventDefault()} className="text-blue-500 hover:underline">Link to Helper App Download Page - Placeholder</a>.</li>
                            <li>Install and run it on your computer.</li>
                            <li>Ensure it's running and not blocked by your firewall.</li>
                            <li>If you've changed the port in the Helper App, configure it below and click 'Retry Connection'.</li>
                        </ol>
                        <div className="my-4">
                            <label htmlFor="helperPortInput" className="block text-sm font-medium text-gray-700 mb-1">Helper App Port:</label>
                            <input 
                                type="text" // Using text to allow empty string for easier input handling
                                id="helperPortInput"
                                value={helperPort}
                                onChange={handlePortInputChange}
                                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm w-full max-w-xs"
                                placeholder="e.g., 3000"
                            />
                        </div>
                        <button 
                            onClick={handleRetryConnection} 
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-150"
                            disabled={helperPort === '' || isNaN(parseInt(helperPort, 10))}
                        >
                            Retry Connection
                        </button>
                    </div>
                )}

                {helperStatus === 'connected' && (
                    <div className="bg-white shadow-md rounded p-6 my-4">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-green-600 text-xl font-semibold">Helper App Connected (Port: {helperPort})</p>
                            <button 
                                onClick={fetchVideosFromHelper} 
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition duration-150"
                                disabled={isLoadingVideosFromHelper}
                            >
                                {isLoadingVideosFromHelper ? 'Refreshing...' : 'Refresh Videos from Helper'}
                            </button>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Videos from Helper:</h2>
                            {isLoadingVideosFromHelper && <p className="text-gray-500">Loading videos...</p>}
                            {!isLoadingVideosFromHelper && videosFromHelper.length === 0 && (
                                <p className="text-gray-500 italic">No videos found in your helper app. Please add some videos using the helper app's interface, then click 'Refresh Videos from Helper'.</p>
                            )}
                            {!isLoadingVideosFromHelper && videosFromHelper.length > 0 && (
                                <ul className="space-y-2">
                                    {videosFromHelper.map((video, index) => {
                                        const registered = isVideoRegistered(video);
                                        return (
                                            <li key={video.id || index} className="bg-gray-50 p-3 rounded-md shadow-sm flex justify-between items-center">
                                                <div>
                                                    <span className="text-gray-800 font-medium">{video.chosenName || video.name || 'Unnamed Video'}</span>
                                                    <span className="text-xs text-gray-500 ml-2">(Source: Helper)</span>
                                                    <p className="text-sm text-gray-600">Path: {video.hlsPath}</p>
                                                    {video.port && <p className="text-sm text-gray-600">Helper Port: {video.port}</p>}
                                                </div>
                                                <button 
                                                    onClick={() => openRegisterModal(video)}
                                                    className={`font-semibold py-1 px-3 rounded text-sm transition duration-150 ${registered ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                                    disabled={registered}
                                                >
                                                    {registered ? 'Already Registered' : 'Register'}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* Platform Registered Videos Section */}
                <div className="bg-white shadow-md rounded p-6 my-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Your Registered Streams on Platform</h2>
                    {isLoadingPlatformVideos && <p className="text-gray-500">Loading registered videos...</p>}
                    {!isLoadingPlatformVideos && platformRegisteredVideos.length === 0 && (
                        <p className="text-gray-500 italic">You haven't registered any local streams on the platform yet. Connect to the helper app and register videos from there.</p>
                    )}
                    {!isLoadingPlatformVideos && platformRegisteredVideos.length > 0 && (
                        <ul className="space-y-3">
                            {platformRegisteredVideos.map(video => (
                                <li key={video._id} className="bg-gray-50 p-4 rounded-lg shadow">
                                    <h3 className="text-lg font-semibold text-blue-700">{video.videoName}</h3>
                                    <p className="text-sm text-gray-600">Description: {video.description || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">Helper Port: {video.helperAppPort}</p>
                                    <p className="text-sm text-gray-600">M3U8 Path: {video.localM3u8Path}</p>
                                    <p className="text-sm text-gray-600">Publicly Accessible: {video.isPubliclyAccessible ? 'Yes' : 'No'}</p>
                                    <div className="mt-3 space-x-2">
                                        <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded text-xs transition duration-150">Edit</button>
                                        <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded text-xs transition duration-150">De-register</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                {/* Registration Modal */}
                {isRegisterModalOpen && selectedVideoForModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-auto">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Register Video: {selectedVideoForModal.chosenName}</h2>
                            {registrationError && <p className="text-red-500 bg-red-100 p-3 rounded mb-3">{registrationError}</p>}
                            {registrationSuccess && <p className="text-green-500 bg-green-100 p-3 rounded mb-3">{registrationSuccess}</p>}
                            
                            <form onSubmit={handleRegisterSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="videoName" className="block text-sm font-medium text-gray-700">Video Name (on platform):</label>
                                    <input 
                                        type="text" 
                                        name="videoName" 
                                        id="videoName"
                                        value={registrationForm.videoName}
                                        onChange={handleRegistrationFormChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (optional):</label>
                                    <textarea 
                                        name="description" 
                                        id="description"
                                        value={registrationForm.description}
                                        onChange={handleRegistrationFormChange}
                                        rows="3"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="modalHelperAppPort" className="block text-sm font-medium text-gray-700">Helper App Port:</label>
                                    <input 
                                        type="number" 
                                        name="modalHelperAppPort" 
                                        id="modalHelperAppPort"
                                        value={registrationForm.modalHelperAppPort}
                                        onChange={handleRegistrationFormChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="isPubliclyAccessible" className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            name="isPubliclyAccessible" 
                                            id="isPubliclyAccessible"
                                            checked={registrationForm.isPubliclyAccessible}
                                            onChange={handleRegistrationFormChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Make this stream publicly accessible?</span>
                                    </label>
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsRegisterModalOpen(false)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition duration-150"
                                        disabled={!!registrationSuccess} // Disable if successfully registered
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-150"
                                        disabled={!!registrationSuccess} // Disable if successfully registered
                                    >
                                        Submit Registration
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyLocalStreamsPage;
