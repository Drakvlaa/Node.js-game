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

    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.get('/cookies', (req, res) => {
    res.send(req.cookies);
});

app.get('/:file', (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(__dirname, 'src', fileName);

    res.sendFile(filePath);
});

app.post('/createRoom', (req, res) => {
    const roomID = nanoid();

    if (rooms.has(roomID)) {
        return res.status(409).json({ error: 'Room already exists' });
    }

    const room = {
        users: new Map(),
    };

    rooms.set(roomID, room);
    res.json({ roomID });
});

app.post('/joinRoom', (req, res) => {
    const roomID = req.body.roomID;
    const socketID = req.body.socketID;

    if (!rooms.has(roomID)) {
        return res.status(404).json({ error: 'Room not found' });
    }

    const room = rooms.get(roomID);
    room.users.set(socketID, users.get(socketID));

    res.json({ message: 'User joined room successfully' });
});

class User {
    constructor({ userID }) {
        this.userID = userID
    }
}

const users = new Map();
const rooms = new Map();
const lobbyMaxSize = 2;

io.on('connection', socket => {
    //console.log('A user connected');

    socket.on('createUser', userID => {
        users.set(socket.id, new User({ userID }))
        //console.log(users)
    })

    socket.on('joinRoom', (roomID, userID) => {
        socket.join(roomID);

        updateRooms()
    });

    socket.on('leaveRoom', (roomID, userID) => {
        socket.leave(roomID);

        updateRooms()
    });

    socket.on('disconnect', () => {
        //console.log('A user disconnected');
        users.delete(socket.id)
        updateRooms()
    });
});

const updateRooms = () => {
    for (const [key, value] of rooms) {
        for (const [usersKey, usersValue] of value.users) {
            if (!users.has(usersKey)) {
                value.users.delete(usersKey)
                if (users.size == 0) {
                    rooms.delete(key)
                }
            }
        }
    }

    rooms.forEach(room => {
        io.to(room.roomID).emit('updateRoom', { id: room.roomID, users: Object.fromEntries(room.users) });
    });
}

setInterval(() => {
    //console.log(rooms)
}, 1000)

server.listen(3000, () => {
    console.log('http://localhost:3000');
});
