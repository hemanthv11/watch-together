import React from "react"
import './page-global.css'
import { useState, useEffect } from "react"
import axios from "axios"
import 'tailwindcss/tailwind.css'

import StandardToolBar from "./menus/standardToolBar"
import VideoPlayer from "./watch-components/videoPlayer"
import VideoQueue from "./watch-components/videoQueue"
import ChatView from "./watch-components/chatView"
import ViewersList from "./watch-components/viewersList"

export default function Watch(room) {
    // video player component
    // chat component
    // video queue component
    // viewer list component

    //get video stream from server
    const [video, setVideo] = useState("")
    useEffect(() => {
        // get video stream from server
        axios.get(`http://localhost:5050/api/video/${room}`).then((res) => {
            setVideo(res.data)
        }).catch((err) => {
            console.log(err)
        })
    }, [])

    //get video queue from server
    const [queue, setQueue] = useState([])
    useEffect(() => {
        // get video queue from server
        axios.get(`http://localhost:5050/api/queue/${room}`).then((res) => {
            setQueue(res.data)
        }
        ).catch((err) => {
            console.log(err)
        })
    })

    //get viewer list from server
    const [viewers, setViewers] = useState([])
    useEffect(() => {
        // get viewer list from server
        axios.get(`http://localhost:5050/api/viewers/${room}`).then((res) => {
            setViewers(res.data)
        }).catch((err) => {
            console.log(err)
        })
    }, [])

    return (
        <div className="h-screen bg-gray-900">
            <StandardToolBar />
            <div className="flex flex-row">
                <div className="w-3/4 flex flex-col">
                    <div>
                        <VideoPlayer vidId={video} />
                    </div>
                    <div>
                        <VideoQueue room={room} queue={queue} />
                    </div>
                </div>
                <div className="w-1/4">
                    <div>
                        <ChatView room={room}/>
                    </div>
                    <div>
                        <ViewersList room={room}/>
                    </div>
                </div>
            </div>
        </div>
    )
}