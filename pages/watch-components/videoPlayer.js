import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import io from 'socket.io-client'
import axios from 'axios'

export default function VideoPlayer({ vidurl, roomId }) {
    const playerRef = useRef(null)
    useEffect(() => {
        const socket = io('http://127.0.0.1:5050')

        const player = videojs('my-video', {
            controls: true,
            autoplay: true,
            preload: 'auto',
            fluid: true,
            sources: [{
                src: vidurl,
                type: 'application/x-mpegURL',
            }],
        })
        console.log(roomId)
        socket.emit('join', roomId)

        player.on('play', () => {
            socket.emit('video', { action: 'play', time: player.currentTime(), roomId: roomId })
        })
        
        player.on('pause', () => {
            socket.emit('video', { action: 'pause', time: player.currentTime(), roomId: roomId })
        })

        socket.on('video', (data) => {
            player.currentTime(data.time)
            if (data.action === 'play') {
                player.play()
            } else if (data.action === 'pause') {
                player.pause()
            }
        })

        playerRef.current = player

        return () => {
            if (player) {
                player.dispose()
            }
            socket.disconnect()
        }
    }, [])

    return (
        <div data-vjs-player>
            <video ref={node => playerRef.current = node} className="video-js" id="my-video"></video>
        </div>
    )
}