import React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import 'tailwindcss/tailwind.css'

export default function QuickVideos() {
    // react component to display 3 video collections from the server and a an upload button
    const [videos, setVideos] = useState([])
    const [flag, setFlag] = useState(false)
    return (
        <div className="flex flex-row justify-start bg-gray-800 text-white mt-4 p-4 rounded-lg w-2/3" style={{
            minHeight: "15vh"
        }}>
            {videos.map((video) => {
                return (
                    <div className="flex flex-col">
                        <img src={video.thumbnail} alt={video.title} className="w-1/3"/>
                        <span>{video.title}</span>
                    </div>
                )
            })}
        </div>
    )
}