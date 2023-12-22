const socket = io();

const redirect = src => (location = src);

socket.on('connect', () => {
	socket.emit('joinGame', gameID);
});

socket.on('redirect', src => redirect(src));
