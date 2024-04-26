import axios from 'axios'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import {User} from '../../../../utils/mongo-schema-builder'

dotenv.config()
const saltRounds = 11

const dbUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/watch_together'

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

export default async function handler(req, res) {
    const { code } = req.query
    console.log('code', code)
    
    if(!code) {
        return res.status(400).json({ error: 'No code provided' })
    }

    const data = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        scope: 'identify email'
    }

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const response = await axios.post('https://discord.com/api/v10/oauth2/token', data, { headers })
    console.log('response', response.data)

    const refreshToken = response.data.refresh_token
    let success

    if(refreshToken) {
        // process the login only if we have a refresh token
        const user = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: `Bearer ${response.data.access_token}`
            }
        })

        console.log('user', user.data)

        // Check if the user is already in the database
        let userExist = await User.findOne({ discordId: user.data.id })

        if(userExist) {
            // Update the user's refresh token
            userExist.refreshToken = refreshToken

            // Update avatar, username, global_name and email
            userExist.avatar = user.data.avatar
            userExist.username = user.data.username
            userExist.global_name = user.data.username
            userExist.email = await bcrypt.hash(user.data.email, saltRounds)

            await userExist.save() // Save the updated user
            success = user
        } else {
            // Create a new user
            const newUser = new User({
                email: await bcrypt.hash(user.data.email, saltRounds),
                username: user.data.username,
                global_name: user.data.global_name,
                avatar: user.data.avatar,
                discordId: user.data.id,
                refreshToken: refreshToken,
                id: new mongoose.Types.ObjectId(),
                siteRole: 'basic'
            })

            await newUser.save()
            success = user
        }

    } else
        return res.status(400).json({ error: 'Malicious login attempt' })
    
    if(success) {
        const token = jwt.sign({ discordId: success.data.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        // save the token in the database
        const user = await User.findOne({ discordId: success.data.id })
        user.sessionToken = token

        // set the cookie and redirect to the home page
        res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1209600`)
        return res.redirect('/app')
    } else {
        return res.status(500).json({ error: 'Internal server error' })
    }
}
