const socket = io();

const getCookie = name => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

socket.on('connect', () => {
    socket.emit('createUser', getCookie("id"))
})

socket.on('updateRoom', data => {
    document.getElementById('roomID').innerHTML = data.id
    let playersList = ""
    console.log(data.users)
    for (const id in data.users) {
        playersList += id + "<br>"
    }
    document.getElementById('players').innerHTML = playersList
})

const createRoom = async () => {
    const response = await fetch('/createRoom', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return await response.json()
}

const joinRoom = async roomID => {
    const response = await fetch('/joinRoom', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomID: roomID.roomID, socketID: socket.id })
    })

    socket.emit('joinRoom', roomID, getCookie('id'))
}

document.getElementById('createRoom').onclick = () => {
    const roomID = createRoom()
    roomID.then(id => joinRoom(id))
};


document.getElementById('joinRoom').onclick = () => {
    const id = document.getElementById('inputRoomID').value
    joinRoom({ roomID: id })
};

