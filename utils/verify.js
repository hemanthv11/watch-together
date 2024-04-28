const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const {User} = require('./mongo-schema-builder')

dotenv.config()

const tokenVerifier = async (token) => {
    if(!token) {
        return { error: 'No token provided' }
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    let user
    try {
        const id = decoded.discordId
        user = await User.findOne({ discordId:id })
    } catch(err) {
        return { error: 'Error fetching user' }
    }
    return user
}

module.exports = tokenVerifier