const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "https://github.io",
        methods: ["GET", "POST"],
        credentials: true
    }
});


let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('プレイヤー接続: ' + socket.id);

    socket.on('join_match', (data) => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomId = 'room_' + waitingPlayer.id + '_' + socket.id;
            waitingPlayer.socket.join(roomId);
            socket.join(roomId);

            waitingPlayer.socket.emit('match_start', { role: 'host', roomId: roomId, stage: data.stage });
            socket.emit('match_start', { role: 'guest', roomId: roomId, stage: data.stage });

            console.log(`マッチ成立: ${roomId}`);
            waitingPlayer = null;
        } else {
            waitingPlayer = { id: socket.id, socket: socket, char: data.char, stage: data.stage };
            console.log('対戦相手を検索中...');
        }
    });

    socket.on('player_update', (data) => {
        socket.to(data.roomId).emit('enemy_update', data);
    });

    socket.on('hit_enemy', (data) => {
        socket.to(data.roomId).emit('receive_hit', {
            dmgDeal: data.dmgDeal,
            vx: -data.vx, // 1Pと2Pで左右反転
            vy: data.vy,
            knockbackTimer: data.knockbackTimer
        });
    });

    socket.on('disconnect', () => {
        console.log('切断: ' + socket.id);
        if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
    });
});

http.listen(3000, () => {
    console.log('サーバーがポート3000で起動しました！');
});
