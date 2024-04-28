// Description: This file contains the schema for the database and the models for the collections. The schema is used to define the structure of the data that will be stored in the database. The models are used to interact with the database and perform operations like creating, reading, updating, and deleting data.

/*
Data to be stored in the database
# Collection: users
User data stored from discord:
email
username
global_name
avatar
discordId
refreshToken

User data stored that are site specific:
id
sessionToken (jwt) (logout deletes this token)
siteRole (admin, basic, tester, privileged)

# Collection: video collections by user
User specific video data stored:
id (user id to get user specific video collections)
videoCollections (array of video collections)

# Collection: video collections
Video collection data stored:
videoCollectionId (unique id for the video collection)
videoCollectionName (name of the video collection)
videoIds (array of video ids)

# Collection: videos
Video data stored:
videoId (unique id for the video)
videoName (name of the video)
videoDuration (duration of the video)

====================

# Collection: rooms
Room data stored:
roomId (unique id for the room)
roomName (name of the room)
roomOwner (id of the room owner taken from the user data schema)
roomMembers (array of user ids)
roomMap (map to store user ids and their room roles, like admin, viewer, remote)
roomVideos (array of video ids)

*/
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()

// connect to the database

const dbUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/watch_together'

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const userSchema = new mongoose.Schema({
    // Data from discord
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    global_name: {
        type: String,
        required: true
    },
    avatar: String,
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    refreshToken: String,

    // Site specific data
    id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    sessionToken: String,
    siteRole: {
        type: String,
        required: true,
        enum: ['admin', 'basic', 'tester', 'privileged']
    }
})

const videoCollectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    videoCollectionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    videoCollectionName: {
        type: String,
        required: true
    },
    videoCollectionThumbnail: {
        type: String // url to the thumbnail
    },
    videoIds: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
    }
})

const videoSchema = new mongoose.Schema({
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    videoName: {
        type: String,
        required: true
    },
    videoDuration: {
        type: Number
    }
})

const roomSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    roomUrl: {
        type: String,
        required: true,
        unique: true
    },
    roomName: {
        type: String,
        required: true
    },
    roomOwner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    roomMembers: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    roomMap: {
        type: Map,
        of: String
    },
    roomVideos: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
    }
})

const User = mongoose.models.User || mongoose.model('User', userSchema)
const VideoCollection = mongoose.models.VideoCollection || mongoose.model('VideoCollection', videoCollectionSchema)
const Video = mongoose.models.Video || mongoose.model('Video', videoSchema)
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema)

module.exports = {
    User,
    VideoCollection,
    Video,
    Room
}

class MongoQ{
    constructor() {
        this.User = User
        this.VideoCollection = VideoCollection
        this.Video = Video
        this.Room = Room
    }

    async createRoom(room){
        const newRoom = new this.Room(room)
        await newRoom.save()
        return newRoom.roomUrl
    }
}

module.exports = MongoQ