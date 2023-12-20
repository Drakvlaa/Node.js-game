const express = require("express")
const { copyFileSync } = require("fs")
const http = require("http")
const { emitWarning } = require("process")
const { Server } = require("socket.io")
//const fs = require("fs")
const app = express()
const server = http.createServer(app)
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

app.use(express.static("src"))
app.use(express.json())

app.get("/", (req, res) =>{
    res.sendFile(__dirname + "/index.html");
})

class Player
{
    constructor({ id = "" })
    {
        this.id = id
    }
}

class Game
{
    constructor()
    {
        this.users = []
    }
}

const users = {}
const games = {}

io.on("connection", socket => {
    console.log(`a user connected: ${socket.id}`)

    users[socket.id] = new Player({ id: socket.id })

    socket.on("disconnect", () => {
        //console.log(`user disconnected: ${socket.id}`)
        delete users[socket.id]
        delete games[socket.id]
    })  

    socket.on("creteNewGame", () => {
        games[socket.id] = new Game()
        socket.emit("urlParams", `?game=${socket.id}`)
    })

    socket.on("joinGame", gameId => {
        if(!games[gameId] || games[gameId].users.length == 2)
        {
            socket.emit("invalidGameId", "")
        }
        else
        {
            games[gameId].users.push(users[socket.id])
            console.log(games)
        }
    })
})

setInterval(() => {
}, 15)

server.listen(3000, ()=>{
    console.log("http://localhost:3000")
})
