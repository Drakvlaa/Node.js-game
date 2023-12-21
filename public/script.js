document.getElementById('createRoom').onclick = () => {
    fetch('createRoom', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(data => location = `/room/${data.roomID}`)
}