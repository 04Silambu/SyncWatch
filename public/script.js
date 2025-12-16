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

// ========== UPLOAD VALIDATION ==========
// Enable video upload only when movie name and genre are filled
const validateUploadInputs = () => {
    const movieNameInput = document.getElementById("movie-name-input")
    const genreSelect = document.getElementById("genre-select")
    const videoUpload = document.getElementById("video-upload")
    const uploadHint = document.getElementById("upload-hint")

    if (!movieNameInput || !genreSelect || !videoUpload) return

    const movieName = movieNameInput.value.trim()
    const genre = genreSelect.value

    if (movieName && genre) {
        // Both filled - enable video upload
        videoUpload.disabled = false
        if (uploadHint) {
            uploadHint.style.display = "none"
        }
    } else {
        // Not filled - disable video upload
        videoUpload.disabled = true
        if (uploadHint) {
            uploadHint.style.display = "block"
        }
    }
}

// Add listeners when upload section is shown
const setupUploadValidation = () => {
    const movieNameInput = document.getElementById("movie-name-input")
    const genreSelect = document.getElementById("genre-select")

    if (movieNameInput && genreSelect) {
        movieNameInput.addEventListener("input", validateUploadInputs)
        genreSelect.addEventListener("change", validateUploadInputs)
        validateUploadInputs() // Initial check
    }
}

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

        // Get movie metadata from inputs
        const movieNameInput = document.getElementById("movie-name-input")
        const genreSelect = document.getElementById("genre-select")

        const movieName = movieNameInput.value.trim()
        const selectedGenre = genreSelect.value

        // Validate movie name
        if (!movieName) {
            alert("Please enter a movie name before uploading!")
            return
        }

        statusEl.innerText = "Uploading video... Please wait."

        const formData = new FormData()
        formData.append("video", file)
        formData.append("roomId", currentRoomId)
        formData.append("movieName", movieName)
        formData.append("genre", selectedGenre) // Empty if "Auto-detect"

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
                console.log(`[HOST] Movie: ${movieName}, Genre: ${selectedGenre || 'Auto-detect'}`)

                // Clear inputs for next upload
                movieNameInput.value = ""
                genreSelect.value = ""
            } else {
                alert("Upload failed: " + (data.error || "Unknown error"))
                statusEl.innerText = "Room ID: " + currentRoomId + " (You are Host)"
            }
        } catch (error) {
            console.error("[HOST] Upload failed:", error)
            alert("Failed to upload video. Please try again.")
            statusEl.innerText = "Room ID: " + currentRoomId + " (You are Host)"
        }

        videoUpload.value = "" // Reset file input for next upload
    }
})

// ========== ROOM EVENTS ==========

// HOST CREATED ROOM
socket.on("room-created", (data) => {
    statusEl.innerText = "Connected as Host"
    currentRole = "host"
    currentRoomId = data.roomId

    // Update new UI elements
    updateRoleBadge("host")
    updateRoomBadge(data.roomId)
    showLiveIndicator()
    updateUIForRoomState(true)
    hideViewerOverlay()

    uploadSection.style.display = "block" // Show upload for host

    // Setup upload validation
    setupUploadValidation()

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
    statusEl.innerText = "Connected as Viewer"
    currentRole = "viewer"
    currentRoomId = data.roomId
    videoEl.controls = false

    // Update new UI elements
    updateRoleBadge("viewer")
    updateRoomBadge(data.roomId)
    showLiveIndicator()
    updateUIForRoomState(true)
    // Overlay removed - viewers can see video clearly

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

// ========== MOVIE RECOMMENDATIONS ==========

const loadRecommendations = async () => {
    console.log("🎬 Fetching recommendations...")
    try {
        const res = await fetch("/recommendations")
        const data = await res.json()
        console.log("📊 Recommendations data:", data)

        const list = document.getElementById("recommendation-list")
        const info = document.getElementById("recommendation-info")

        list.innerHTML = ""
        info.innerHTML = ""

        // Handle no recommendations
        if (!data.movies || data.movies.length === 0) {
            info.innerText = "Watch some movies to get personalized recommendations!"
            info.style.color = "#999"
            return
        }

        // Show genre info
        info.innerText = `Based on your love for ${data.genre} (${data.count} ${data.count === 1 ? 'view' : 'views'})`
        info.style.display = "block"

        // Display recommendations using new card UI
        renderRecommendationCards(data.movies)

        console.log("✅ Displayed", data.movies.length, "recommendations")
    } catch (error) {
        console.error("❌ Failed to load recommendations:", error)
    }
}

// Load recommendations when page loads
loadRecommendations()

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
    // Use the new bubble rendering function
    renderChatMessage(data)
})

