const express = require('express');
const session = require('express-session');
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

app.use(
	session({
		secret: 'my-secret',
		resave: false,
		saveUninitialized: true,
	}),
);

app.use((req, res, next) => {
	if (!req.session.token) {
		req.session.token = nanoid();
	}

	next();
});

app.get('/', (req, res) => {
	res.render('index');
});

app.get('/room/:roomID', (req, res) => {
	const roomID = req.params.roomID;

	if (!rooms.has(roomID)) return res.redirect('/');

	rooms.get(roomID).tokens.push();

	return res.render('room', { roomID });
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

app.get('/room/:roomID/startGame', (req, res) => {
	const roomID = req.params.roomID;
	if (!rooms.has(roomID)) return;
	const room = rooms.get(roomID);
	const tokens = [...room.tokens];
	games.set(roomID, new Game({ tokens, id: roomID }));

	for (const key of room.users.keys()) {
		io.to(key).emit('redirect', `/game/${roomID}`);
	}
});

app.get('/game/:gameID', (req, res) => {
	const gameID = req.params.gameID;
	if (!games.has(gameID)) return res.redirect('/');

	const userToken = req.session.token;
	if (!games.get(gameID).tokens.includes(userToken)) return res.redirect('/');
	res.render('game', { gameID });
});

app.get('/getToken', (req, res) => {
	const token = req.session.token;
	res.json({ token });
});

app.get('*', function (req, res) {
	res.redirect('/');
});

const CollisonAABB = (obj1, obj2) => {
	return (
		obj1.position.x < obj2.position.x + obj2.scale.x &&
		obj1.position.x + obj1.scale > obj2.position.x &&
		obj1.position.y < obj2.position.y + obj2.scale.y &&
		obj1.position.y + obj1.scale.y > obj2.position.y
	);
};

class GameObject {
	constructor(components) {
		this.gameObject = {
			tag: 'new gameObject',
		};

		this.components = components;

		for (const name in this.components) {
			const component = new components[name]();
			for (const prop in component) {
				this[prop] = component[prop];
			}
		}
	}

	Destroy(object = this) {
		allObjects.splice(allObjects.indexOf(object), 1);
	}
}

function Transform() {
	this.transform = {
		position: {
			x: 0,
			y: 0,
		},
		scale: {
			x: 1,
			y: 1,
		},
		anchor: {
			x: 0,
			y: 0,
		},
		velocity: {
			x: 0,
			y: 0,
		},
		rotation: {
			x: 0,
			y: 0,
		},
	};
}

function BoxCollider() {
	this.boxCollider = {
		isTrigger: false,
	};

	this.OnCollisionEnter = collision => {};
	this.OnCollisionExit = collision => {};
	this.OnCollisionStay = collision => {};
}

class Controller {
	constructor() {
		this.classObjects = [];
	}

	GetClassObjects(name, game) {
		this.classObjects = [];
		for (let i = 0; i < game.allObjects.length; ++i) {
			if (game.allObjects[i].components[name]) this.classObjects.push(game.allObjects[i]);
		}
	}
}

class TransformController extends Controller {
	constructor() {
		super();
	}

	Update(game) {
		this.GetClassObjects('Transform', game);
		this.classObjects.forEach(object => {
			object.transform.position.x += object.transform.velocity.x;
			object.transform.position.y += object.transform.velocity.y;
		});
	}
}

class BoxColliderController extends Controller {
	constructor() {
		super();
		this.objectsInCollision = [];
	}

	Update(game) {
		this.GetClassObjects('BoxCollider', game);
		for (let i = 0; i < this.classObjects.length; ++i) {
			for (let j = i + 1; j < this.classObjects.length; ++j) {
				let index = this.containsArray(this.objectsInCollision, [
					this.classObjects[i],
					this.classObjects[j],
				]);
				if (CollisonAABB(this.classObjects[i].transform, this.classObjects[j].transform)) {
					if (index > -1) {
						this.classObjects[i].OnCollisionStay(this.classObjects[j]);
						this.classObjects[j].OnCollisionStay(this.classObjects[i]);
					} else {
						this.objectsInCollision.push([this.classObjects[i], this.classObjects[j]]);
						this.classObjects[i].OnCollisionEnter(this.classObjects[j]);
						this.classObjects[j].OnCollisionEnter(this.classObjects[i]);
					}
				} else {
					if (index > -1) {
						this.objectsInCollision.splice(index, 1);
						this.classObjects[i].OnCollisionExit(this.classObjects[j]);
						this.classObjects[j].OnCollisionExit(this.classObjects[i]);
					}
				}
			}
		}
	}

	containsArray(inside, array) {
		for (let i = 0; i < inside.length; ++i) {
			if (
				(array[0] == inside[i][0] && array[1] == inside[i][1]) ||
				(array[1] == inside[i][0] && array[0] == inside[i][1])
			) {
				return i;
			}
		}
		return -1;
	}
}

class Player extends GameObject {
	constructor({ tag }) {
		super({ Transform, BoxCollider });
		this.gameObject.tag = tag;

		this.OnCollisionEnter = collision => {
			console.log('test');
		};
	}
}

class User {
	constructor({ roomID }) {
		this.userID = '';
		this.roomID = roomID;
	}
}

class Game {
	constructor({ tokens = [], id }) {
		this.id = id;
		this.tokens = tokens;
		this.timeout;
		this.timeoutIsSet = false;
		this.users = new Map();
		this.allObjects = [];
		this.controllers = [new BoxColliderController(), new TransformController()];
	}

	Update() {
		if (!this.timeoutIsSet && this.users.size == 0) {
			this.timeoutIsSet = true;

			this.timeout = setTimeout(() => {
				games.delete(this.id);
			}, 5e3);
		} else if (this.timeoutIsSet && this.users.size > 0) {
			clearTimeout(this.timeout);
			this.timeoutIsSet = false;
		}

		this.controllers.forEach(controller => {
			controller.Update(this);
		});
	}
}

io.on('connection', socket => {
	socket.token = socket.handshake.headers.token;

	socket.on('joinGame', gameID => {
		if (!games.has(gameID)) return socket.emit('redirect', '/game');
		games.get(gameID).users.set(socket.id, new Player({ roomID: gameID, tag: socket.id }));
		socket.gameID = gameID;
	});

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
		if (users.has(socket.id)) {
			const roomID = users.get(socket.id).roomID;
			const room = rooms.get(roomID);
			room.users.delete(socket.id);
			room.tokens.splice(room.tokens.indexOf(socket.token), 1);
			updateRoom(roomID);
			users.delete(socket.id);
		}

		if (games.has(socket.gameID)) {
			games.get(socket.gameID).users.delete(socket.id);
		}
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
	for (const game of games.values()) {
		game.Update();
	}
}, 15);

server.listen(3000, () => {
	console.log('http://localhost:3000');
});
