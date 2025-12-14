const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

// Store room metadata with host-first architecture
const rooms = new Map()

app.use(express.static(path.join(__dirname, "../public")))

// Generate unique room ID
const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8)
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // HOST: Create a new room
    socket.on("create-room", () => {
        const roomId = generateRoomId()

        // Implicitly create room by joining
        socket.join(roomId)

        // Store room metadata with host-first pattern
        rooms.set(roomId, {
            hostId: socket.id,
            videoState: {
                url: null,
                currentTime: 0,
                isPlaying: false
            },
            members: [socket.id],
            createdAt: Date.now()
        })

        socket.emit("room-created", { roomId, role: "host" })
        console.log(`[ROOM CREATED] ${roomId} | Host: ${socket.id}`)
    })

    // GUEST: Join an existing room
    socket.on("join-room", (roomId) => {
        const room = rooms.get(roomId)

        if (!room) {
            socket.emit("error-msg", "Room does not exist")
            return
        }

        socket.join(roomId)
        room.members.push(socket.id)

        // Send current video state to the new guest
        socket.emit("room-joined", {
            roomId,
            role: "viewer",
            videoState: room.videoState
        })

        // Notify others in the room
        socket.to(roomId).emit("user-joined", { userId: socket.id })

        console.log(`[ROOM JOINED] ${roomId} | Viewer: ${socket.id} | Total: ${room.members.length}`)
    })

    // HOST CONTROL: Play video
    socket.on("play", ({ roomId, currentTime }) => {
        const room = rooms.get(roomId)

        // Verify host authority
        if (room && room.hostId === socket.id) {
            room.videoState.isPlaying = true
            room.videoState.currentTime = currentTime

            // Broadcast to all viewers in the room
            socket.to(roomId).emit("play", { currentTime })
            console.log(`[PLAY] ${roomId} | Time: ${currentTime}s`)
        }
    })

    // HOST CONTROL: Pause video
    socket.on("pause", ({ roomId, currentTime }) => {
        const room = rooms.get(roomId)

        if (room && room.hostId === socket.id) {
            room.videoState.isPlaying = false
            room.videoState.currentTime = currentTime

            socket.to(roomId).emit("pause", { currentTime })
            console.log(`[PAUSE] ${roomId} | Time: ${currentTime}s`)
        }
    })

    // HOST CONTROL: Seek to specific time
    socket.on("seek", ({ roomId, currentTime }) => {
        const room = rooms.get(roomId)

        if (room && room.hostId === socket.id) {
            room.videoState.currentTime = currentTime

            socket.to(roomId).emit("seek", { currentTime })
            console.log(`[SEEK] ${roomId} | Time: ${currentTime}s`)
        }
    })

    // HOST CONTROL: Change video URL
    socket.on("changeVideo", ({ roomId, url }) => {
        const room = rooms.get(roomId)

        if (room && room.hostId === socket.id) {
            room.videoState.url = url
            room.videoState.currentTime = 0
            room.videoState.isPlaying = false

            socket.to(roomId).emit("changeVideo", { url })
            console.log(`[VIDEO CHANGED] ${roomId} | URL: ${url}`)
        }
    })

    // Cleanup on disconnect
    socket.on("disconnect", () => {
        for (const [roomId, room] of rooms.entries()) {
            // Remove user from room
            room.members = room.members.filter(id => id !== socket.id)

            // If host disconnected, close the room
            if (room.hostId === socket.id) {
                rooms.delete(roomId)
                io.to(roomId).emit("room-closed", { message: "Host disconnected" })
                console.log(`[ROOM CLOSED] ${roomId} | Host disconnected`)
            }
            // If room is empty, delete it
            else if (room.members.length === 0) {
                rooms.delete(roomId)
                console.log(`[ROOM DELETED] ${roomId} | No members left`)
            }
            // Notify others that user left
            else {
                io.to(roomId).emit("user-left", { userId: socket.id })
            }
        }
        console.log(`[DISCONNECTED] ${socket.id}`)
    })
})

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
})
