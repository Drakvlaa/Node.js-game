const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 });

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'))
app.set('views', path.join(__dirname, '/public'));
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    if (!req.cookies.id) res.cookie("id", nanoid(), { expire: 360000 + Date.now() });
    res.render('index');
});

app.get('/room/:roomID', (req, res) => {
    if (!rooms.has(req.params.roomID)) return res.redirect('/');
    return res.render('room', { roomID: req.params.roomID });
});

app.get('/room', (req, res) => {
    res.redirect('/')
})

app.get('/createRoom', (req, res) => {
    const roomID = nanoid();

    while (rooms.has(roomID)) roomID = nanoid()

    const room = {
        users: new Map(),
    };

    rooms.set(roomID, room);
    res.json({ roomID });
});

class User {
    constructor({ roomID }) {
        this.userID = ''
        this.roomID = roomID
    }
}

const users = new Map();
const rooms = new Map();
const lobbyMaxSize = 2;

io.on('connection', socket => {
    socket.on('joinRoom', roomID => {
        if (!rooms.has(roomID)) return socket.emit('redirect', '/room ')
        socket.join(roomID)
        users.set(socket.id, new User({ roomID }))
        rooms.get(roomID).users.set(socket.id, users.get(socket.id))
        updateRoom(roomID)
    })

    socket.on('quitRoom', roomID => {
        socket.leave(roomID)
    })

    socket.on('disconnect', () => {
        if (!users.has(socket.id)) return
        const roomID = users.get(socket.id).roomID
        rooms.get(roomID).users.delete(socket.id)
        updateRoom(roomID)
        users.delete(socket.id)
    })
})

const updateRoom = roomID => {
    if (!rooms.has(roomID)) return
    if (rooms.get(roomID).users.size == 0) return rooms.delete(roomID)

    for (const key of rooms.get(roomID).users.keys()) {
        io.to(key).emit('updateRoom', { users: Object.fromEntries(rooms.get(roomID).users) });
    }
}

setInterval(() => {
    //console.log(rooms)
}, 1000)

server.listen(3000, () => {
    console.log('http://localhost:3000');
});
