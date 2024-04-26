const express = require('express')
const cors = require('cors')
const fs = require('fs')
const https = require('https')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const next = require('next')
const tokenVerifier = require('./utils/verify')
const cookieParser = require('cookie-parser')

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

    router.get('/', (req, res) => {
        // get session token
        const token = req.cookies.token
        if(token) {
            const user = tokenVerifier(token)
            if(user.error) {
                return app.render(req, res, '/')
            }
            return app.render(req, res, '/app', { user })
        }
        return app.render(req, res, '/')
    })

    router.get('/app', (req, res) => {
        // get session token
        const token = req.cookies.token
        if(token) {
            const user = tokenVerifier(token)
            if(user.error) {
                return app.render(req, res, '/')
            }
            return app.render(req, res, '/app', { user })
        }
        return app.render(req, res, '/')
    })

    router.get('/health', (req, res) => {
        res.send('Health check ping')
    })

    router.get('*', (req, res) => {
        return handle(req, res)
    })

    router.post('/api/room', (req, res) => {
        const name = req.body.name
        const roomCode = Math.random().toString(36).substring(2, 7)
        const roomUrl = Math.random().toString(36).substring(2, 9)
        const room = {
            name: name,
            code: roomCode,
            url: roomUrl
        }
        res.send(room)
    })

    // query processing
    router.get('/watch?', (req, res) => {
        const room = req.query.room
        return app.render(req, res, '/watch', { room })
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
        server = https.createServer({ key, cert }, router)
    } else {
        server = router
    }

    server.listen(port, () => {
        console.log(`Server is running on https://localhost:${port}/`)
    })

})