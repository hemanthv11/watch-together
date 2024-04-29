import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

export default function ChatView({ room }) {
    const [chat, setChat] = useState([])
    const [userName, setUser] = useState('RLION')
    const [userId, setUserId] = useState('')
    const [message, setMessage] = useState('')
    const socketRef = useRef();
    const roomId = room._id

    useEffect(() => {
        axios.get('/api/auth/username')
        .then((res) => {
            console.log('User', res.data)
            setUser(res.data) // TODO: handle guest users
        })
        .catch((err) => {
            console.log(err)
        })

        axios.get('/api/current/room')
        .then((res) => {
            console.log('User', res.data)
            setUserId(res.data)
        })
    }, [])

    useEffect(() => {
        axios.get(`/api/chat/${roomId}`)
        .then((res) => {
            console.log(res.data)
            // setChat(...chat, res.data)
        })
        .catch((err) => {
            console.log(err)
        })
    }, [room])

    // after loading the chat messages connect to the socket for real-time chat
    useEffect(() => {
        const socket = io('http://127.0.0.1:5050')
        socketRef.current = socket
        socketRef.current.emit('join', roomId)
        socketRef.current.on('chat message', (message) => {
            setChat([...chat, message])
            // broadcast the message to all clients in the same room
            socketRef.current.to(message.room).emit('chat message', message)
        })
        return () => {
            socketRef.current.disconnect()
        }
    }, [chat])

    useEffect(() => {
        axios.post('/api/chat', { roomId, message: message, userId: userId, global_name: userName })
        .then((res) => {
            console.log(res)
        })
        .catch((err) => {
            console.error(err)
        })
        setMessage('')
    }, [chat])

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
                <input id="new-msg" type="text" placeholder="Type a message" className="rounded-lg p-2 text-black mr-2 w-3/4" name='message'/>
                <button className="rounded-lg p-2 bg-blue-600 text-white w-1/4" onClick={
                    () => {
                        const mg = document.getElementById('new-msg')
                        const message = mg.value
                        setMessage(message)
                        const chatObj = { user: userName, message: message}
                        const sock = { user: userName, message: message, room: roomId}
                        socketRef.current.emit('chat message', sock)
                        setChat([...chat, chatObj])
                        mg.value = ''

                    }
                }>Send</button>
            </div>
        </div>
    )
}