const socket = io()

const statusEl = document.getElementById("b")
const videoEl = document.getElementById("e")
const uploadSection = document.getElementById("upload-section")
const videoUpload = document.getElementById("video-upload")
const chatBox = document.getElementById("chat-box")
const chatInput = document.getElementById("chat-input")

let currentRole = null
let currentRoomId = null

const createRoom = () => {
    socket.emit("create-room")
}

const joinRoom = () => {
    const roomId = document.getElementById("c").value
    socket.emit("join-room", roomId)
}

window.createRoom = createRoom
window.joinRoom = joinRoom

// ========== ROOM CONTROL FUNCTIONS ==========
const deleteRoom = () => {
    if (currentRole === "host" && currentRoomId) {
        if (confirm("Are you sure you want to delete this room?")) {
            socket.emit("delete-room", { roomId: currentRoomId })
        }
    }
}

const exitRoom = () => {
    if (currentRole === "viewer" && currentRoomId) {
        socket.emit("leave-room", { roomId: currentRoomId })
        location.reload() // Refresh page after exiting
    }
}

window.deleteRoom = deleteRoom
window.exitRoom = exitRoom

// ========== VIDEO UPLOAD (HOST ONLY) ==========

videoUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0]
    if (file && currentRole === "host") {
        // Check file size (500MB limit)
        if (file.size > 500 * 1024 * 1024) {
            alert("Video file is too large! Maximum size is 500MB.")
            videoUpload.value = "" // Reset input
            return
        }

        statusEl.innerText = "Uploading video... Please wait."

        const formData = new FormData()
        formData.append("video", file)
        formData.append("roomId", currentRoomId)

        try {
            const response = await fetch("/upload", {
                method: "POST",
                headers: {
                    "x-socket-id": socket.id  // 🔒 For host verification
                },
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                // Host also loads the video
                videoEl.src = data.url
                statusEl.innerText = "Room ID: " + currentRoomId + " (You are Host) - Video uploaded!"
                console.log("[HOST] Video uploaded successfully:", data.url)
            } else {
                alert("Upload failed: " + (data.error || "Unknown error"))
                statusEl.innerText = "Room ID: " + currentRoomId + " (You are Host)"
            }
        } catch (error) {
            console.error("[HOST] Upload failed:", error)
            alert("Failed to upload video. Please try again.")
            statusEl.innerText = "Room ID: " + currentRoomId + " (You are Host)"
        }

        videoUpload.value = "" // Reset input for next upload
    }
})

// ========== ROOM EVENTS ==========

// HOST CREATED ROOM
socket.on("room-created", (data) => {
    statusEl.innerText = "Room ID: " + data.roomId + " (You are Host)"
    currentRole = "host"
    currentRoomId = data.roomId
    uploadSection.style.display = "block" // Show upload for host

    // 🔒 Disable join UI for host
    document.getElementById("c").disabled = true
    document.querySelector("button[onclick='joinRoom()']").disabled = true

    // Show delete room button for host
    document.getElementById("room-controls").style.display = "block"
    document.getElementById("delete-room-btn").style.display = "inline-block"

    console.log("Role:", currentRole)
})

// VIEWER JOINED ROOM
socket.on("room-joined", (data) => {
    statusEl.innerText = "Joined Room: " + data.roomId + " (Viewer)"
    currentRole = "viewer"
    currentRoomId = data.roomId
    videoEl.controls = false

    // Show exit room button for viewer
    document.getElementById("room-controls").style.display = "block"
    document.getElementById("exit-room-btn").style.display = "inline-block"

    console.log("Role:", currentRole)

    // SYNC STATE ON JOIN (late joiner sync)
    if (data.videoState.url) {
        videoEl.src = data.videoState.url
        videoEl.currentTime = data.videoState.currentTime
        if (data.videoState.isPlaying) {
            videoEl.play()
        }
    }
})

// ========== HOST VIDEO CONTROLS (EMIT EVENTS) ==========

// HOST PLAY
videoEl.addEventListener("play", () => {
    if (currentRole === "host") {
        socket.emit("play", {
            roomId: currentRoomId,
            currentTime: videoEl.currentTime
        })
        console.log("[HOST] Play at:", videoEl.currentTime)
    }
})

// HOST PAUSE
videoEl.addEventListener("pause", () => {
    if (currentRole === "host") {
        socket.emit("pause", {
            roomId: currentRoomId,
            currentTime: videoEl.currentTime
        })
        console.log("[HOST] Pause at:", videoEl.currentTime)
    }
})

// HOST SEEK
videoEl.addEventListener("seeked", () => {
    if (currentRole === "host") {
        socket.emit("seek", {
            roomId: currentRoomId,
            currentTime: videoEl.currentTime
        })
        console.log("[HOST] Seek to:", videoEl.currentTime)
    }
})

// ========== VIEWER VIDEO SYNC (RECEIVE EVENTS) ==========

// VIEWER RECEIVE PLAY
socket.on("play", (data) => {
    if (currentRole === "viewer") {
        videoEl.currentTime = data.currentTime
        videoEl.play()
        console.log("[VIEWER] Synced play at:", data.currentTime)
    }
})

// VIEWER RECEIVE PAUSE
socket.on("pause", (data) => {
    if (currentRole === "viewer") {
        videoEl.currentTime = data.currentTime
        videoEl.pause()
        console.log("[VIEWER] Synced pause at:", data.currentTime)
    }
})

// VIEWER RECEIVE SEEK
socket.on("seek", (data) => {
    if (currentRole === "viewer") {
        videoEl.currentTime = data.currentTime
        console.log("[VIEWER] Synced seek to:", data.currentTime)
    }
})

// VIEWER RECEIVE VIDEO CHANGE
socket.on("changeVideo", (data) => {
    // Both host and viewers load the new video
    videoEl.src = data.url
    videoEl.currentTime = 0
    console.log("[VIDEO CHANGED] New video loaded:", data.url)
})

// ========== ERROR HANDLING ==========

socket.on("error-msg", (msg) => {
    alert(msg)
})

// Room closed event
socket.on("room-closed", (data) => {
    alert(data.message)
    location.reload() // Refresh page
})

// ========== WATCH HISTORY ==========

const loadHistory = async () => {
    console.log("📥 Fetching history...")
    const res = await fetch("/history")
    const data = await res.json()
    console.log("📊 History data received:", data)

    const body = document.getElementById("history-body")
    body.innerHTML = ""

    data.forEach(h => {
        const row = document.createElement("tr")

        // Format genre with confidence badge
        const confidence = h.genre_confidence || 0
        const confidencePercent = (confidence * 100).toFixed(0)

        // Color code by confidence level
        let confidenceClass = "low"
        if (confidence >= 0.5) confidenceClass = "high"
        else if (confidence >= 0.3) confidenceClass = "medium"

        const genreHtml = h.genre !== "Unknown"
            ? `<span class="genre-badge">${h.genre}</span> <span class="confidence-${confidenceClass}">${confidencePercent}%</span>`
            : `<span style="color: #999;">Unknown</span>`

        row.innerHTML = `
            <td>${h.movieName}</td>
            <td>${genreHtml}</td>
            <td>${Math.round(h.duration)}</td>
            <td>${new Date(h.watchedAt).toLocaleString()}</td>
            <td><button onclick="deleteHistory(${h.id})">Delete</button></td>
        `

        body.appendChild(row)
    })
    console.log("✅ Rendered", data.length, "history entries")
}

const deleteHistory = async (id) => {
    await fetch("/history/" + id, { method: "DELETE" })
    loadHistory()
}

// Make deleteHistory available globally
window.deleteHistory = deleteHistory

// Load history when page loads
loadHistory()

// ========== REAL-TIME CHAT ==========

const sendMessage = () => {
    const text = chatInput.value.trim()
    if (!text || !currentRoomId) return

    socket.emit("chat-message", {
        roomId: currentRoomId,
        message: text,
        role: currentRole
    })

    chatInput.value = ""
}

window.sendMessage = sendMessage

socket.on("chat-message", (data) => {
    const msg = document.createElement("div")
    msg.innerHTML = `<b>${data.role}</b> [${data.time}]: ${data.message}`
    chatBox.appendChild(msg)
    chatBox.scrollTop = chatBox.scrollHeight
})

