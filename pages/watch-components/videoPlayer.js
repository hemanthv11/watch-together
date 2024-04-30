import React, { useEffect, useRef } from 'react'
import 'tailwindcss/tailwind.css'
import { useState } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import io from 'socket.io-client'
import axios from 'axios'

export default function VideoPlayer({owner, roomId }) {
    const playerRef = useRef(null)
    const [vidurl, setVideo] = useState('https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8')
    const [ready, setReady] = useState(false)
    useEffect(() => {
        let player = videojs('my-video', {
            controls: true,
            autoplay: true,
            preload: 'auto',
            fluid: true,
        })
      
        const socket = io('http://127.0.0.1:5050')
        socket.emit('join', roomId)
      
        player.on('play', () => {
            socket.emit('video', { action: 'play', time: player.currentTime(), roomId })
        })
      
        player.on('pause', () => {
          socket.emit('video', { action: 'pause', time: player.currentTime(), roomId })
        });
      
        socket.on('video', (data) => {
            player.currentTime(data.time)
            if (data.action === 'play')
                player.play()
            else if (data.action === 'pause')
                player.pause()
        })

        // new video listener
        socket.on('new video', (url) => {
            player.src({
                src: url,
                type: 'application/x-mpegURL',
            })
            player.load()
            player.play()
        })

        // new video emitter
        socket.emit('new video', vidurl)
      
        // Update source when vidurl changes
        player.src({ src: vidurl, type: 'application/x-mpegURL' })
      
        playerRef.current = player
      
        return () => {
            socket.disconnect();
        }
      }, [vidurl]) // Include vidurl in dependency array
      

    return (
        <div data-vjs-player>
            <video ref={node => {playerRef.current = node}} className="video-js" id="my-video"></video>
            {/* add video */}
            {owner &&
                <div>
                    <div className="flex flex-row items-center p-5">
                        <input id="video-url" type="text" placeholder="Enter video URL" className="rounded-lg p-2 text-black mr-2 w-2/3"/>
                        <button className="rounded-lg p-2 bg-blue-600 text-white" onClick={() => {
                            const url = document.getElementById('video-url').value    
                            setVideo(url)
                            console.log('Adding video', vidurl)
                        }}>Add Video</button>
                    </div>    
                </div>
            }          
        </div>
    )
}