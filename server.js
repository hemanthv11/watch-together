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
const MongoQ = require('./utils/mongo-schema-builder')

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
        console.log('Home route')
        const token = req.cookies.token
        if(token) {   
            console.log('token', token)
            const user = await tokenVerifier(token)
            console.log(user)
            if(user && user.error) {
                console.log('error', user.error)
                res.redirect('/login/error')
                return
            }
            console.log('redirecting to /app')
            res.redirect('/app')
        }
        return app.render(req, res, '/')
    })

    router.get('/app', async (req, res) => {
        const q = req.query
        console.log('Query', q)
        const token = req.cookies.token
        console.log('/app route')
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

    router.get('/watch', (req, res) => {
        // login check
        const token = req.cookies.token
        if(!token) {
            res.redirect('/')
        }
        const room = req.query.room
        // check room validity in the database
        
        return app.render(req, res, '/watch', { room })
    })

    router.get('/health', (req, res) => {
        res.send('Health check ping')
    })

    router.get('*', (req, res) => {
        return handle(req, res)
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