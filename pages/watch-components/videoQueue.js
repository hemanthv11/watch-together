import React from "react"
import { useState, useEffect } from "react"

export default function VideoQueue({room, queue}){
    return(
        <div className="flex flex-col text-white mr-2 ml-2 mt-5 mb-5 border-r-2 border-gray-500 p-4 rounded-lg" style={{ backgroundColor: '#364872', maxHeight: '400px', overflowY: 'auto' }}>
            <div className="text-xl bold">Video Queue</div>
            <div className="flex flex-col mt-4">
                {queue.map((video) => {
                    return(
                        <div className="flex flex-row justify-between items-center bg-gray-800 p-2 rounded-lg mt-2">
                            {/* Video list item */}
                            <VideoItem video={video} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}