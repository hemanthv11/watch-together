import React from "react"
import { useState, useEffect } from "react"

export default function StandardToolBar() {
    const [loggedIn, setLoggedIn] = useState(false)
    useEffect(() => {
        if (localStorage.getItem('user')) {
            setLoggedIn(true)
        }
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
                {loggedIn && <div className="flex items-center">
                    <a href="/logout" className="text-white font-bold py-2 px-4 rounded-lg" onClick={() => {localStorage.removeItem('user'); setLoggedIn(false)}}>Logout</a>
                </div>}
            </div>
        </section>
    )
}