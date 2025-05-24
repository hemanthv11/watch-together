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
    console.log('Room', room)
    const [owner, setOwner] = useState(false) // check if the user is the owner of the room
    const [queue, setQueue] = useState([]) // video queue for VideoQueue component
    const [video, setVideo] = useState('') // video to play in the video player
    useEffect(async () => {
        // setQueue(room.roomVideos) // loads the video queue
        const res = await axios.get('/api/current/room')
        if(res.data === room.roomData.roomOwner){
            setOwner(true)
        }
    }, [])

    return (
        <div className="h-screen bg-gray-900">
            <StandardToolBar />
            <div className="flex flex-row text-white p-5 align-items-center justify-between">
                <div className="flex flex-row align-items-center justify-between">
                    <div className="font-bold text-6xl mr-5">{room.roomData.roomName}</div>
                    <div className="text-gray-400 align-items-center text-center mt-9" onClick={() => {
                        navigator.clipboard.writeText(room.roomData.roomCode)
                    }}>
                    Code: {room.roomData.roomCode}</div>
                </div>
                {/* end room button */}
                {owner &&
                    <div className="bg-red-500 rounded-lg p-1 text-center flex flex-row items-center">
                        <button className="text-white p-1"
                        onClick={async () => {
                            console.log('Ending room', room)
                            axios.post('/api/room/end', {room: room.roomData},{withCredentials: true})
                            .then((res) => {
                                console.log(res)
                                window.location.href = '/app'
                            }).catch((err) => {
                                console.error(err)
                            })
                        }}
                        >End</button>
                    </div>}
            </div>
            <div className="flex flex-row">
                <div className="w-3/4 flex flex-col">
                    <div>
                        <VideoPlayer owner={owner} roomId={room} />
                    </div>
                    <div>
                        <VideoQueue room={room.roomData} queue={room.roomData.roomVideos}/>
                    </div>
                </div>
                <div className="w-1/4 mr-2">
                    <div>
                        <ChatView room={room.roomData}/>
                    </div>
                    {/* <div>
                        <ViewersList room={room.roomData}/>
                    </div> */}
                </div>
            </div>
        </div>
    )
}

export async function getServerSideProps(context) {
    const { room } = context.query
    try {
        const res = await axios.get(`http://127.0.0.1:5050/api/room/${room}`)
        const roomData = res.data
        return {
            props: {
                roomData
            }
        }
    } catch (error) {
        if (error instanceof AggregateError) {
            // Log individual errors
            for (const individualError of error.errors) {
                console.error(individualError)
            }
        } else {
            // Log any other errors
            console.error(error)
        }
        // Return an empty roomData prop to avoid a serialization error
        return {
            props: {
                roomData: {}
            }
        }
    }
}