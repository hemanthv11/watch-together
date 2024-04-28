import dotenv from 'dotenv'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

export default async function handler(req, res) {
    const token = req.cookies.token
    if(token) {
        res.clearCookie('token')
        res.status(200).json({ message: 'Logged out' })
    } else {
        res.status(400).json({ error: 'No token found' })
    }
}