const redirect = src => (location = src);

fetch('/getToken')
	.then(response => response.json())
	.then(data => {
		const socket = io('', {
			transportOptions: {
				polling: {
					extraHeaders: {
						token: data.token,
					},
				},
			},
		});

		socket.on('connect', () => {
			socket.emit('joinRoom', roomID);
		});

		socket.on('redirect', src => redirect(src));

		socket.on('updateRoom', data => {
			let playersList = '';
			for (const id in data.users) {
				playersList += id + '<br>';
			}
			document.getElementById('players').innerHTML = playersList;
		});

		socket.on('joinGame', roomID => {
			redirect(`/game/${roomID}`);
		});
	});

document.getElementById('quitRoom').onclick = () => {
	redirect('/room');
};

document.getElementById('startGame').onclick = () => {
	fetch(`${location.pathname}/startGame`);
};
