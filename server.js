const express = require('express')
const cors = require('cors')
const fs = require('fs')
const https = require('https')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const next = require('next')
const tokenVerifier = require('./utils/verify')
const cookieParser = require('cookie-parser')
const { Server } = require('socket.io')
const http = require('http')
const {MongoQ} = require('./utils/mongo-schema-builder')

dotenv.config()

var port

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev: process.env.NODE_ENV !== 'production' })
const handle = app.getRequestHandler()

if(dev == true) {
    console.log('Running in development mode')
    port = 5050
} else {
    console.log('Running in production mode')
    port = process.env.PORT || 5050
}

app.prepare().then(() => {
    const router = express()
    
    router.use(cors())
    router.use(bodyParser.json())
    router.use(cookieParser())

    router.get('/', async (req, res) => {
        // get session token
        const token = req.cookies.token
        if(token) {   
            const user = await tokenVerifier(token)
            if(user && user.error) {
                console.log('error', user.error)
                res.redirect('/')
                return
            }
            console.log('redirecting to /app')
            res.redirect('/app')
        }
        return app.render(req, res, '/')
    })

    router.get('/api/room/:room', async (req, res) => {
        const room = req.params.room
        const mq = new MongoQ()
        const roomDat = await mq.checkRoom(room)
        if(roomDat && roomDat.error) {
            res.send({ error: 'Room not found' })
        } else {
            res.send(roomDat)
        }
    })

    router.get('/app', async (req, res) => {
        const q = req.query
        const token = req.cookies.token
        if(token) {
            const user = await tokenVerifier(token)
            console.log('token', token)
            console.log('user', user)
            if(user && user.error) {
                console.log('User in app', user)
                res.redirect('/')
            }
            return app.render(req, res, '/app')
        }
        console.log('No token found')
        res.redirect('/')
    })

    router.get('/watch', async (req, res) => {
        // login check
        // const token = req.cookies.token
        // if(!token) {
        //     res.redirect('/')
        // }
        const room = req.query.room
        // check room validity in the database
        const mq = new MongoQ()
        const roomDat = await mq.checkRoom(room)
        let roomUrl
        if(roomDat && !roomDat.error) {
            roomUrl = roomDat.roomUrl
            return app.render(req, res, '/watch', { room: roomUrl })
        } else{
            return app.render(req, res, '/not_found')
        }
    })

    router.get('/api/auth/username', async (req, res) => {
        const token = req.cookies.token
        const user = await tokenVerifier(token)
        if(user && user.error) {
            res.send({ error: 'User not found' })
        } else {
            res.send(user.global_name)
        }
    })

    router.get('/api/join/:room', async (req, res) => {
        const room = req.params.room
        const mq = new MongoQ()
        const roomData = await mq.getRoom(room)
        console.log('Room data', roomData)
        if(roomData && roomData.error) {
            res.send({ error: 'Room not found' })
        } else if(roomData!=null) {
            res.send(roomData.roomUrl)
        } else {
            res.send({ error: 'Room not found' })
        }
    })

    router.get('/api/current/room', async (req, res) => {
        const token = req.cookies.token
        const user = await tokenVerifier(token)
        if(user && user.error) {
            res.send({ error: 'User not found' })
        } else{
            res.send(user._id)
        }
    })

    router.get('/api/chat/:roomId', async (req, res) => {
        const { roomId } = req.params
        const mq = new MongoQ()
        const chat = await mq.getChat(roomId)
        res.send(chat)
    })

    router.get('/health', (req, res) => {
        res.send('Health check ping')
    })

    router.get('*', (req, res) => {
        return handle(req, res)
    })

    router.post('/api/room', async (req, res) => {
        const token = req.cookies.token
        console.log('Token', req.cookies)
        let user
        if(token) {
            user = await tokenVerifier(token)
        } else {
            res.redirect('/')
            return
        }
        const name = req.body.name
        const roomCode = Math.random().toString(36).substring(2, 7)
        const roomUrl = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
        const roomVidCollection = req.body.vidCollection
        const room = {
            roomName: name,
            roomCode: roomCode,
            roomUrl: roomUrl,
            roomOwner: user._id,
            roomVideos: roomVidCollection
        }
        console.log('Creating room', room.roomCode)
        const mq = new MongoQ()
        await mq.createRoom(room)
        res.setHeader('Set-Cookie', `roomDetails=${user._id}+${room.roomUrl}; Path=/watch; HttpOnly; SameSite=Strict; Max-Age=86400`)
        res.send(room)
    })

    router.post('/api/room/end', async (req, res) => {
        const token = req.cookies.token
        if(token) {
            const user = await tokenVerifier(token)
            if(user && user.error) {
                res.send({ error: 'User not found' })
            }
            const roomUrl = req.body.room.roomUrl
            const roomOwner = req.body.room.roomOwner
            console.log('User', user._id)
            console.log('Room owner', roomOwner)
            if(user._id == roomOwner) {
                console.log('Ending room', roomUrl)
                const mq = new MongoQ()
                await mq.endRoom(roomUrl)
                res.send({ success: 'Room ended' })
                res.redirect('/app')
            } else {
                res.send({ error: 'User not authorized' })
            }
        }
    })

    router.post('/api/video', async (req, res) => {

    })

    router.post('/api/chat', async (req, res) => {
        const { roomId, message, userId, global_name } = req.body
        const mq = new MongoQ()
        await mq.addChatMessage(roomId, userId, message, global_name)
        res.send({ success: 'Message sent' })
    })

    let key, cert
    let server
    try{
        key = fs.readFileSync('../ssl_keys/key.pem')
        cert = fs.readFileSync('../ssl_keys/cert.pem')
        server = true
    } catch (error) {
        console.error('SSL keys not found running normal http express server')
        server = false
    }

    if(server){
        httpServer = https.createServer({ key, cert }, router)
    } else {
        httpServer = http.createServer(router)
    }

    const io = new Server(httpServer)

    io.on('connection', (socket) => {
        console.log('A user connected')
    
        socket.on('join', (room) => {
            socket.join(room)
        })
    
        socket.on('video', (data) => {
            console.log('Video data', data)
            socket.broadcast.emit('video', data)
            socket.to(data.room).emit('video', data)
        })
    
        // Listen for chat messages
        socket.on('chat message', (message) => {
            console.log('Chat message', message)
            // Broadcast the message to all clients in the same room
            console.log('Message room', message.room)
            socket.to(message.room).emit('chat message', message)
            // save the message to the database
            const mq = new MongoQ()

        })
    
        socket.on('disconnect', () => {
            console.log('A user disconnected')
        })
    })


    httpServer.listen(port, () => {
        console.log(`Server is running on https://localhost:${port}/`)
    })

})