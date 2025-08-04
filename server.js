import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from "express";
import bodyParser from "body-parser";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { idToIndex, indexToId, getRandomIdIndex } from "./friendlyids.js";
import { SticksGame } from "./sticksGame.js";
import crypto from "crypto";
import "dotenv/config";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

// Game index -> Game state
const gamesMap = new Map();

// Player token -> Player number, game index
const playerMap = new Map();

// Socket id -> Player token
const socketMap = new Map();

// Game index -> Socket id
// Used to form opponent pairs
const gameSocketMap = new Map();

// Socket -> Socket
// Maps a socket to its opponent's socket
const opponentSocketMap = new Map();

function generatePlayerToken() {
    return crypto.randomUUID();
}

function registerPlayer(token, gameIndex, player) {
    playerMap.set(token, { index: gameIndex, player: player, joined: false, socketId: null }); // number instead of player?
}

function setPlayerJoinedStatus(token, joinedStatus) {
    playerMap.get(token).joined = joinedStatus;
}

function addSocketPair(socketA, socketB) {
    opponentSocketMap.set(socketA, socketB);
    opponentSocketMap.set(socketB, socketA);
}

function getSocketOpponent(socket) {
    return opponentSocketMap.get(socket);
}

// This removes a socket and its pair
function removeSocket(socket) {
    const opponentId = getSocketOpponent(socket);
    opponentSocketMap.delete(opponentId);
    opponentSocketMap.delete(socket);
}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post('/', (req, res) => {
    if (req.body && req.body.game) {
        return res.sendFile(`${__dirname}/public/game.html`);
    }

    return res.sendFile(`${__dirname}/public/index.html`);
});

app.post("/api/create", async (req, res) => {
    const { id: gameId, index: index } = getRandomIdIndex();
    // TODO: check for collision to be safe

    gamesMap.set(index, new SticksGame(0)); // TODO: generate seed (or is it even necessary?)

    const playerToken = generatePlayerToken();
    registerPlayer(playerToken, index, 0); // Join player as player 1

    await delay(1000); // TODO: remove this debugging delay!

    return res.send({ gameId: gameId, token: playerToken });
});

app.post("/api/join/:gameId", (req, res) => {
    const gameId = req.params.gameId;

    if (!gameId) return res.status(400).send({ error: "Missing game ID!" });

    const gameIndex = idToIndex(gameId);

    if (!gamesMap.has(gameIndex)) {
        return res.status(404).send({ error: "Game ID not found!" });
    }

    const playerToken = generatePlayerToken();
    registerPlayer(playerToken, gameIndex, 1);

    return res.send({ token: playerToken });
});

app.use(express.static('public'));

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

io.on('connection', (socket) => {
    console.log(`Client connected (${socket.id})`);

    // Called by the client when joining the game on the game page
    socket.on('joinGame', (token, ack) => {

        const playerData = playerMap.get(token);
        if (!playerData) return ack({ error: "Invalid or expired token!" });

        if (playerData.joined) {
            return ack({ error: "Already joined on this device!" });
        }

        const gameIndex = playerData.index;
        socket.join(gameIndex);

        // Mark player as joined
        setPlayerJoinedStatus(token, true);
        socketMap.set(socket.id, token);

        if (gameSocketMap.has(gameIndex)) {
            addSocketPair(gameSocketMap.get(gameIndex), socket);
            console.log(`Second one to join game, adding ${socket.id} to socket pair`);
        } else {
            gameSocketMap.set(gameIndex, socket);
            console.log(`First one to join game, adding ${socket.id} to game-socket map`);
        }

        io.to(gameIndex).emit("joinGame", playerData.player);

        return ack({ success: true });
    });

    socket.on('moveCard', (index, x, y) => {
        // TODO: parse move made by player and maintain game state

        // const playerData = playerMap.get(socketMap.get(socket.id));
        // const gameIndex = playerData.index;
        //console.log(`Index: ${index} | (${x}, ${y})`);

        getSocketOpponent(socket).emit("moveCard", index, x, y);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected (${socket.id})`);

        const token = socketMap.get(socket.id);
        if (!token) {
            console.log("Could not find socket id")
            return;
        }
        const playerData = playerMap.get(token);
        if (!playerData) {
            console.log("Could not find player data");
            return;
        }

        const gameIndex = playerData.index;

        io.to(gameIndex).emit("leaveGame", playerData.player);

        setPlayerJoinedStatus(token, false);

        socketMap.delete(socket.id);
        // TODO: delete(?) from playerMap
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});