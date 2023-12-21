const socket = io();

socket.on('connect', () => {
    socket.emit('joinRoom', roomID)
})

socket.on('redirect', src => redirect(src))

const redirect = src => location = src

socket.on('updateRoom', data => {
    let playersList = ""
    for (const id in data.users) {
        playersList += id + "<br>"
    }
    document.getElementById('players').innerHTML = playersList
})

document.getElementById('quitRoom').onclick = () => {
    redirect('/room')
}