import React from "react";
// Assuming a socket instance is available, e.g., imported or passed as a prop
// import socket from './socket'; // Placeholder for socket instance

export default function VideoQueue({ room, queue, socket }) { // Assuming socket is passed as a prop
    
    const handleVideoItemClick = (video) => {
        if (!video || !video.helperAppPort || !video.localM3u8Path) {
            console.error("Video data is incomplete for URL construction:", video);
            // Optionally, display an error to the user
            return;
        }
        const constructedUrl = `http://localhost:${video.helperAppPort}${video.localM3u8Path}`;
        console.log("Constructed M3U8 URL:", constructedUrl);

        // Emit the URL via socket
        if (socket) {
            // Emit only the constructed URL string as per requirement
            socket.emit('new video', constructedUrl);
            console.log(`Emitted 'new video' event with URL: ${constructedUrl} for room: ${room.roomUrl}`); // Log still includes room for context
        } else {
            console.warn("Socket instance not available. Cannot emit 'new video' event.");
            // Fallback or error display if socket is crucial for functionality
        }
        // Potentially, also update a local state to show which video is currently playing, etc.
    };

    // Ensure queue is an array before mapping
    const videoQueue = Array.isArray(queue) ? queue : [];

    return (
        <div className="flex flex-col text-white mr-2 ml-2 mt-5 mb-5 border-r-2 border-gray-500 p-4 rounded-lg" style={{ backgroundColor: '#364872', maxHeight: '400px', overflowY: 'auto' }}>
            <div className="text-xl font-bold mb-4">Video Queue</div> {/* Added font-bold and mb-4 */}
            <div className="flex flex-col">
                {videoQueue.length > 0 ? (
                    videoQueue.map((video) => (
                        // Assuming video object directly contains videoName, helperAppPort, localM3u8Path, and _id
                        <div 
                            key={video._id || video.videoId} // Use video._id if available from DB, fallback for safety
                            className="flex flex-row justify-between items-center bg-gray-800 p-3 rounded-lg mt-2 cursor-pointer hover:bg-gray-700 transition duration-150"
                            onClick={() => handleVideoItemClick(video)}
                        >
                            <span className="truncate">{video.videoName || 'Unnamed Video'}</span>
                            {/* Optionally, add a play icon or other indicators */}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">No videos in the queue.</p>
                )}
            </div>
        </div>
    );
}