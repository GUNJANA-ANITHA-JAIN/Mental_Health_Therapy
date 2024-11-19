const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public' directory
app.use(express.static('public'));

// Multiplayer socket logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Notify others of a new user
    socket.broadcast.emit('userConnected', { id: socket.id });

    // Handle user updates
    socket.on('updatePosition', (data) => {
        socket.broadcast.emit('positionUpdated', data); // Share updates with others
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        socket.broadcast.emit('userDisconnected', { id: socket.id });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
