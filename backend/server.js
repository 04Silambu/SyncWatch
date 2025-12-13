const a = require("express")
const b = require("http")
const c = require("socket.io")
const d = require("path")

const e = a()
const f = b.createServer(e)
const g = new c.Server(f)

e.use(a.static(d.join(__dirname, "../public")))

g.on("connection", (h) => {
    console.log("User connected:", h.id)

    h.on("disconnect", () => {
        console.log("User disconnected:", h.id)
    })
})

f.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
})
