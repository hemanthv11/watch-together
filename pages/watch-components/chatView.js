import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

export default function ChatView({ room }) {
    const [chat, setChat] = useState([]);
    const socketRef = useRef();

    useEffect(() => {
        axios.get(`http://localhost:5050/api/chat/${room}`)
        .then((res) => {
            setChat(res.data)
        })
        .catch((err) => {
            console.log(err)
        })

        // Connect to the socket.io server
        socketRef.current = io.connect('http://127.0.0.1:5050')

        // Listen for chat messages
        socketRef.current.on('chat message', (message) => {
            setChat((chat) => [...chat, message])
        });

        // Emit a join event to join the room
        socketRef.current.emit('join', room)

        return () => {
            // Disconnect from the socket.io server
            socketRef.current.disconnect()
        }
    }, [room])

    const sendMessage = (event) => {
        event.preventDefault()
        const message = { user: 'RLION', text: event.target.elements.message.value }
        socketRef.current.emit('chat message', message)
        event.target.elements.message.value = ''
    }
    return(
        <div className="flex flex-col text-white mt-1 ml-2 mb-5 border-r-2 border-gray-500 p-1 rounded-lg" style={{ backgroundColor: '#364872', maxHeight: '400px', overflowY: 'auto' }}>
            <div className="text-xl bold">Chat</div>
            <div className="flex flex-col mt-4 bg-gray-800 rounded-lg p-2" style={{maxHeight: '300px', minHeight: '300px', overflowY: 'auto'}}>
                {chat.map(({ user, message }, index) => (
                    <div key={index} className="flex flex-row">
                        <span className="text-gray-400">{user}</span>
                        <span className="text-white ml-2">{message}</span>
                    </div>
                ))}
            </div>
            {/* chat input */}
            <div className="flex flex-row mt-2" style={{width: '100%'}}>
                <input id="new-msg" type="text" placeholder="Type a message" className="rounded-lg p-2 text-black mr-2 w-3/4"/>
                <button className="rounded-lg p-2 bg-blue-600 text-white w-1/4" onClick={
                    () => {
                        // send message to server add to chat
                        const newMessage = document.getElementById('new-msg').value;
                        setChat([...chat, {user: "RLION", message: newMessage}])
                    }
                }>Send</button>
            </div>
        </div>
    )
}