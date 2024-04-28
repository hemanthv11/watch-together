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
        await mq.checkRoom(room).then((room) => {
            if(room) {
                return app.render(req, res, '/watch', { room })
            } else {
                return app.render(req, res, '/not_found')
            }
        }).catch((err) => {
            console.error(err)
            return app.render(req, res, '/not_found')
        })
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
            console.log('Token found', token)
            user = await tokenVerifier(token)
            console.log('user', user)
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
        res.send(room)
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
        socket.on('disconnect', () => {
            console.log('A user disconnected')
        })
    })


    httpServer.listen(port, () => {
        console.log(`Server is running on https://localhost:${port}/`)
    })

})