import React from "react"
import { useState, useEffect } from "react"
import 'tailwindcss/tailwind.css'
import axios from "axios"

import StandardToolBar from "./menus/standardToolBar"

export default function Create() {
    // react component to create a new room
    // get the room code from the server and redirect the user to the room
    const [room, setRoom] = useState("")
    const [notification, setNotification] = useState(false)
    const showNotification = () => {
        setNotification(true);
        setTimeout(() => {
          setNotification(false);
        }, 30000);
        return
    };
    async function getRoom() {
        const roomName = document.getElementById('room-name').value
        await axios.post('http://localhost:5050/api/room', {name: roomName}).then((res) => {
            let room = res.data
            let roomCode = room.code
            let roomUrl = room.url
            setRoom(room)
            navigator.clipboard.writeText(roomCode)
            showNotification()
            //delay redirect to allow time for notification to show
            setTimeout(() => {
                window.location.href = `/watch?room=${roomUrl}`
            }, 3000)
        }).catch((err) => {
            console.log(err)
        })
    }
    return (
        <div>
            <StandardToolBar/>
            {notification && <div>Room code copied to clipboard</div>}
            <div className="h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
                <div className="w-2/3">
                    <form className="flex flex-row justify-start">
                        <input id="room-name" type="text" placeholder="Enter Room Name" className="rounded-lg p-2 text-black mr-2 w-2/3"/>
                        <button className="rounded-lg p-2 bg-blue-600 text-white" onClick={(e)=>{
                            e.preventDefault()
                            getRoom()
                        }}>Create Room</button>
                    </form>
                    {/* Instructions */}
                    <div className="flex flex-col mt-4 justify-start">
                        <span className="text-white">
                            Create a room and share the room code with your friends to watch videos together.
                        </span>
                        <span className="text-white">
                            You can also upload videos to the room and watch them together.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}