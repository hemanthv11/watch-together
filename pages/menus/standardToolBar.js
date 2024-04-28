import React from "react"
import { useState, useEffect } from "react"
import axios from "axios"

export default function StandardToolBar() {
    const [flag, setFlag] = useState(false)
    useEffect(() => {
        axios.get('/api/auth/verify')
        .then((res) => {
            if(res.data.loggedIn) {
                setFlag(true)
            }
        })
    }, [])
    return (
        <section className="flex justify-between items-center p-4 bg-blue-600 shadow-md">
            <div className="flex items-center">
                <div className="flex items-center">
                    <span className="text-3xl font-bold text-white">Watch Together</span>
                </div>
            </div>
            <div className="flex items-center">
                <div className="flex items-center">
                    <a href="/about" className="text-white font-bold py-2 px-4 rounded-lg">About</a>
                </div>
                <div className="flex items-center">
                    <a href="/privacy" className="text-white font-bold py-2 px-4 rounded-lg">Privacy</a>
                </div>
                <div className="flex items-center">
                    <a href="/contact" className="text-white font-bold py-2 px-4 rounded-lg">Contact</a>
                </div>
                {flag && <div className="flex items-center cursor-pointer"><a className="text-white font-bold py-2 px-4 rounded-lg" onClick={
                    async () => {
                        await axios.get("/api/auth/logout")
                        window.location.href = "/"
                    }
                }>Log Out</a></div>}
            </div>
        </section>
    )
}