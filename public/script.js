const a = io()

const b = document.getElementById("b")
const c = document.getElementById("e")

const aCreate = () => {
    a.emit("create-room")
}

const d = () => {
    const e = document.getElementById("c").value
    a.emit("join-room", e)
}

window.a = aCreate
window.d = d

a.on("room-created", (f) => {
    b.innerText = "Room ID: " + f.roomId + " (You are Host)"
    console.log("Role:", f.role)
})

a.on("role", (f) => {
    console.log("Role:", f)
    if (f === "viewer") {
        c.controls = false
    }
})

a.on("error-msg", (f) => {
    alert(f)
})
