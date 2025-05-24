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
    id: { // Ensured this is type: mongoose.Schema.Types.ObjectId, required: true, unique: true
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


const videoSchema = new mongoose.Schema({
    uploader: { // Renamed from id, references 'User'
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // videoId field removed, Mongoose's default _id will be used
    videoName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    localM3u8Path: { // Stores path like "/streams/<some_id>/playlist.m3u8"
        type: String,
        required: true
    },
    helperAppPort: {
        type: Number,
        required: true
    },
    duration: { // Renamed from videoDuration
        type: Number
    },
    isPubliclyAccessible: {
        type: Boolean,
        default: false
    },
    addedDate: {
        type: Date,
        default: Date.now
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
    roomOwner: { // Ensures this refers to User via mongoose.Schema.Types.ObjectId
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    roomCode: {
        type: String,
        required: true
    },
    roomMembers: { // Ensures this is an array of mongoose.Schema.Types.ObjectId referencing User
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    roomMap: {
        type: Map,
        of: String
    },
    roomVideos: { // Ensures this is an array of mongoose.Schema.Types.ObjectId referencing Video
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
    }
})

const chatSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Room'
    },
    // array of user, message pairs
    chat: {
        type: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, message: String, global_name: String}]
    }
})

const User = mongoose.models.User || mongoose.model('User', userSchema)
//const VideoCollection = mongoose.models.VideoCollection || mongoose.model('VideoCollection', videoCollectionSchema)
const Video = mongoose.models.Video || mongoose.model('Video', videoSchema)
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema)
const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema)



class MongoQ{
    constructor() {
        this.User = User
        this.Video = Video
        this.Room = Room
        this.Chat = Chat
    }

    async registerLocalStream(videoData) {
        const newVideo = new this.Video(videoData);
        await newVideo.save();
        return newVideo;
    }

    async getRegisteredVideosForUser(uploaderId) {
        return await this.Video.find({ uploader: uploaderId });
    }

    async getRegisteredVideoById(videoId) {
        return await this.Video.findById(videoId);
    }

    async updateRegisteredVideo(videoId, uploaderId, updateData) {
        return await this.Video.findOneAndUpdate({ _id: videoId, uploader: uploaderId }, updateData, { new: true });
    }

    async deleteRegisteredVideo(videoId, uploaderId) {
        return await this.Video.findOneAndDelete({ _id: videoId, uploader: uploaderId });
    }

    async createRoom(roomDetails){ // roomDetails.roomOwner should be a User.id
        // create roomId
        roomDetails.roomId = new mongoose.Types.ObjectId()
        // roomDetails.roomOwner should already be a valid ObjectId referencing a User
        const newRoom = new this.Room(roomDetails)
        await newRoom.save()
        return newRoom.roomUrl
    }

    async checkRoom(roomUrl){
        const room = await this.Room.findOne({roomUrl})
        return room
    }
    
    async addViewer(roomUrl, userId){ // userId should be User._id
        const room = await this.Room.findOne({roomUrl})
        if (room && userId) {
            // Ensure userId is not already in roomMembers before pushing
            if (!room.roomMembers.find(memberId => memberId.equals(userId))) {
                room.roomMembers.push(userId);
                await room.save();
            }
        }
    }

    // This method seems incomplete or its purpose unclear in the original code.
    // Based on the schema changes, it might be intended to check video ownership.
    // async checkOwnerVideoAccess(videoId, userId){ // videoId is Video._id, userId is User._id
    //     const video = await this.Video.findOne({_id: videoId, uploader: userId });
    //     return !!video; // Returns true if video found (user is owner), false otherwise
    // }

    async removeViewer(roomUrl, userId){ // userId should be User._id
        const room = await this.Room.findOne({roomUrl})
        if (room && userId) {
            room.roomMembers = room.roomMembers.filter((memberId) => !memberId.equals(userId));
            await room.save()
        }
    }

    async addVideoToRoom(roomUrl, videoId){ // videoId should be Video._id
        const room = await this.Room.findOne({roomUrl})
        if (room && videoId) {
            // Ensure videoId is not already in roomVideos before pushing
            if (!room.roomVideos.find(vId => vId.equals(videoId))) {
                room.roomVideos.push(videoId);
                await room.save();
            }
        }
    }

    async endRoom(roomUrl, ownerId){ // ownerId should be User.id (which is User._id)
        const room = await this.Room.findOne({roomUrl});
        if (room && room.roomOwner.equals(ownerId)) {
            // Also delete associated chat session
            await this.Chat.deleteOne({ roomId: room.roomId });
            const result = await this.Room.deleteOne({ roomUrl });
            return result;
        }
        return null; // Or throw an error indicating permission denied or room not found
    }

    async getRoom(roomCode){
        const room = await this.Room.findOne({roomCode})
        return room
    }

    async getGlobalName(userId){ // userId should be User._id
        const user = await this.User.findById(userId) // Changed to findById for _id
        return user ? user.global_name : null;
    }

    async getChat(roomId){ // roomId should be Room._id (which is Room.roomId)
        const chat = await this.Chat.findOne({roomId})
        return chat // array of user, message pairs
    }

    async addChatSession(roomId){ // roomId should be Room._id (which is Room.roomId)
        let chat = await this.Chat.findOne({roomId : roomId});
        if (chat) {
            return chat; // Return existing chat session if found
        }
        chat = new this.Chat({roomId: roomId}) // Use the passed roomId
        // add a welcome message to the chat
        let systemUserId;
        try {
            // Ensure process.env.SYSTEM_ID is treated as a string for ObjectId conversion
            systemUserId = new mongoose.Types.ObjectId(String(process.env.SYSTEM_ID));
        } catch (error) {
            console.warn("SYSTEM_ID is not a valid ObjectId. Chat message from 'System' will not have a valid user ref.", error);
            // Fallback: Storing null or a predefined system user string/ID might be an option
            // For now, 'user' field might be absent or invalid for this message if SYSTEM_ID is bad
            systemUserId = null; // Or some other placeholder if your schema allows
        }
        // Ensure the user field in chat schema can handle null if SYSTEM_ID is invalid and Mongoose validation is strict
        chat.chat.push({user: systemUserId, message: 'Welcome to the chat', global_name: 'System'})
        await chat.save()
        return chat; // Return the created chat session
    }

    async addChatMessage(roomId, userId, message, global_name){ // roomId, userId should be Room._id, User._id
        let chat = await this.Chat.findOne({roomId: roomId}) // Use the passed roomId
        // if chat session does not exist, create one
        if(!chat){
            // Pass roomId when creating a new chat session
            chat = await this.addChatSession(roomId) // Pass roomId here
        }
        if(message.length === 0)
            return

        // Ensure userId is an ObjectId if it's coming as a string
        const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        chat.chat.push({user: userObjectId, message, global_name}) // user field should be 'user' not 'userId' as per schema
        await chat.save()
    }
}

module.exports = {
    User,
    Video,
    Room,
    Chat,
    MongoQ
}