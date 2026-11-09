const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let rooms = {};

io.on('connection', (socket) => {
    socket.on('create_friend_room', (data) => {
        let roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[roomId] = { id: roomId, players: {}, max: data.maxPlayers || 2 };
        rooms[roomId].players[1] = { id: socket.id, char: data.char };
        socket.join(roomId);
        socket.emit('friend_room_created', { roomId: roomId });
    });

    socket.on('join_friend_room', (data) => {
        let r = rooms[data.roomId];
        if (r) {
            let slot = Object.keys(r.players).length + 1;
            r.players[slot] = { id: socket.id, char: data.char };
            socket.join(data.roomId);
            io.to(data.roomId).emit('friend_room_joined', { roomId: data.roomId, currentPlayers: slot, maxPlayers: r.max });
            if (slot >= r.max) {
                io.to(data.roomId).emit('friend_match_start', { roomId: data.roomId, players: r.players });
            }
        }
    });

    socket.on('multi_player_update', (data) => {
        let r = rooms[data.roomId];
        if (r) {
            r.players[socket.id] = data;
            socket.to(data.roomId).emit('multi_enemy_update', { players: r.players });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {});
