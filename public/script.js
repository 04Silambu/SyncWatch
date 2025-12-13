const a = io()

a.on("connect", () => {
    console.log("Connected to server:", a.id)
})
