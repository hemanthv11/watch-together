import React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import 'tailwindcss/tailwind.css'

export default function ViewersList({room}){
    const [viewers, setViewers] = useState([])
    useEffect(() => {
        // get viewer list from server
        axios.get(`http://localhost:5050/api/viewers/${room}`).then((res) => {
            setViewers(res.data)
        }).catch((err) => {
            console.log(err)
        })
    }, [])
    return(
        <div className="flex flex-col text-white mt-5 ml-2 mb-5 border-r-2 border-gray-500 p-1 rounded-lg" style={{ backgroundColor: '#364872', maxHeight: '400px', overflowY: 'auto' }}>
            <div className="text-xl bold">Viewers</div>
            <div className="flex flex-col mt-4">
                {viewers.map((viewer) => {
                    return(
                        <div className="flex flex-row justify-between items-center bg-gray-800 p-2 rounded-lg mt-2">
                            <div>{viewer}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}