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

app.get('/', (req, res) => {
    if (!req.cookies.id) res.cookie("id", nanoid(), { expire: 360000 + Date.now() });
    res.cookie("roomID", nanoid())
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.get('/:file', (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, 'src', fileName);

    res.sendFile(filePath);
});

app.post('/createRoom', (req, res) => {
    const roomID = req.cookies.roomID;

    if (rooms.has(roomID)) return


    const room = {
        users: new Map(),
    };

    rooms.set(roomID, room);
    res.json({ roomID });
});

app.post('/joinRoom', (req, res) => {
    const roomID = req.body.roomID;
    const socketID = req.body.socketID;

    if (!rooms.has(roomID)) return

    const room = rooms.get(roomID);
    room.users.set(socketID, users.get(socketID));

    res.json({ message: 'User joined room successfully' });
});

class User {
    constructor({ userID }) {
        this.userID = userID
        this.roomID = ''
    }
}

const users = new Map();
const rooms = new Map();
const lobbyMaxSize = 2;

io.on('connection', socket => {
    //console.log('A user connected');

    socket.on('createUser', userID => {
        users.set(socket.id, new User({ userID }))
    })

    socket.on('joinRoom', (roomID, userID) => {
        socket.join(roomID);

        const user = users.get(socket.id)
        if (user.roomID != '' && user.roomID != roomID) {
            //console.log(io.sockets.adapter.rooms.get(user.roomID))
            socket.leave(user.roomID);
            updateRooms(user.roomID);
        }
        user.roomID = roomID
        updateRooms(roomID)
    });

    socket.on('leaveRoom', (roomID, userID) => {
        socket.leave(roomID);
        users.get(socket.id).roomID = ''
        updateRooms(roomID)
    });

    socket.on('disconnect', () => {
        const roomID = users.get(socket.id).roomID
        users.delete(socket.id)
        updateRooms(roomID)
    });
});

const updateRooms = roomID => {
    if (rooms.has(roomID)) {
        const roomUsers = rooms.get(roomID).users
        for (const key of roomUsers.keys()) {
            if (!users.has(key) || !io.sockets.adapter.rooms.get(roomID)) {
                rooms.get(roomID).users.delete(key)
                if (roomUsers.size == 0) {
                    rooms.delete(roomID)
                }
            }
            io.to(key).emit('updateRoom', { id: roomID, users: Object.fromEntries(roomUsers) });
        }
    }
}

setInterval(() => {
    console.log(rooms)
}, 500)

server.listen(3000, () => {
    console.log('http://localhost:3000');
});
