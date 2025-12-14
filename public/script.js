const socket = io()

const statusEl = document.getElementById("b")
const videoEl = document.getElementById("e")

const createRoom = () => {
    socket.emit("create-room")
}

const joinRoom = () => {
    const roomId = document.getElementById("c").value
    socket.emit("join-room", roomId)
}

window.createRoom = createRoom
window.joinRoom = joinRoom

socket.on("room-created", (data) => {
    statusEl.innerText = "Room ID: " + data.roomId + " (You are Host)"
    console.log("Role:", data.role)
})

socket.on("room-joined", (data) => {
    statusEl.innerText = "Joined Room: " + data.roomId + " (Viewer)"
    console.log("Role:", data.role)
    videoEl.controls = false
})

socket.on("role", (role) => {
    console.log("Role:", role)
    if (role === "viewer") {
        videoEl.controls = false
    }
})

socket.on("error-msg", (msg) => {
    alert(msg)
})
