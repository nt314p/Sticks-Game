const socket = io();

const token = window.localStorage.getItem("token");

socket.emit("joinGame", token);

socket.on("joinGame", (playerNumber) => {
    console.log(`Player ${playerNumber + 1} joined!`);
});

socket.on("leaveGame", (playerNumber) => {
    console.log(`Player ${playerNumber + 1} left!`);
});