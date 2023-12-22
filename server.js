const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	pingInterval: 2000,
	pingTimeout: 5000,
});

const sessionKey = nanoid();
const users = new Map();
const rooms = new Map();
const games = new Map();
const lobbyMaxSize = 2;

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('views', path.join(__dirname, '/public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	res.render('index');
});

app.get('/room/:roomID', (req, res) => {
	const roomID = req.params.roomID;

	if (!rooms.has(roomID)) return res.redirect('/');

	rooms.get(roomID).tokens.push();

	return res.render('room', { roomID });
});

app.get('/room/:roomID/startGame', (req, res) => {
	const roomID = req.params.roomID;
	if (!rooms.has(roomID)) return;

	games.set(roomID, new Game({ tokens: rooms.get(roomID).tokens }));

	for (const key of rooms.get(roomID).users.keys()) {
		io.to(key).emit('joinGame', roomID);
	}
});

app.get('/game/:roomID/', (req, res) => {
	const roomID = req.params.roomID;
	res.render('game', { roomID });
});

app.get('/createRoom', (req, res) => {
	const roomID = nanoid();

	const room = {
		users: new Map(),
		tokens: [],
	};

	rooms.set(roomID, room);
	res.json({ roomID });
});

app.get('/getToken', (req, res) => {
	const token = nanoid();
	res.json({ token });
});

app.get('*', function (req, res) {
	res.redirect('/');
});

class User {
	constructor({ roomID }) {
		this.userID = '';
		this.roomID = roomID;
	}
}

class Game {
	constructor({ tokens = [] }) {
		this.id = nanoid();
		this.tokens = tokens;
	}

	addPlayer(token) {
		this.tokens.push(token);
	}
}

io.on('connection', socket => {
	socket.token = socket.handshake.headers.token;

	socket.on('joinRoom', roomID => {
		if (!rooms.has(roomID)) return socket.emit('redirect', '/room ');
		socket.join(roomID);
		users.set(
			socket.id,
			new User({
				roomID,
			}),
		);
		rooms.get(roomID).users.set(socket.id, users.get(socket.id));
		rooms.get(roomID).tokens.push(socket.token);
		updateRoom(roomID);
	});

	socket.on('disconnect', () => {
		if (!users.has(socket.id)) return;
		const roomID = users.get(socket.id).roomID;
		const room = rooms.get(roomID);
		room.users.delete(socket.id);
		room.tokens.splice(room.tokens.indexOf(socket.token), 1);
		updateRoom(roomID);
		users.delete(socket.id);
	});
});

const updateRoom = roomID => {
	if (!rooms.has(roomID)) return;
	if (rooms.get(roomID).users.size == 0) return rooms.delete(roomID);

	for (const key of rooms.get(roomID).users.keys()) {
		io.to(key).emit('updateRoom', {
			users: Object.fromEntries(rooms.get(roomID).users),
		});
	}
};

setInterval(() => {
	//console.log(rooms);
}, 1000);

server.listen(3000, () => {
	console.log('http://localhost:3000');
});
