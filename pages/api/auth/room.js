import MongoQ from "@/utils/mongo-schema-builder"
import jwt from 'jsonwebtoken'

const handler = async (req, res) => {
    const token = req.cookies.token
    if(token) {
        const user = jwt.verify(token, process.env.JWT_SECRET)
        if(user) {
            res.send({loggedIn: true})
        }
    } else {
        res.send({loggedIn: false})
    }
    const name = req.body.name
        const roomCode = Math.random().toString(36).substring(2, 7)
        const roomUrl = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
        const roomVidCollection = req.body.vidCollection
        const room = {
            name: name,
            code: roomCode,
            url: roomUrl,
            roomOwner: user.id,
            vidCollection: roomVidCollection
        }
        const mq = new MongoQ()
        await mq.createRoom(room)
        res.send(room)
}

