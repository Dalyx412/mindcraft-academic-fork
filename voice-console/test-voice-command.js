/**
 * Send a test voice-command to a running MindServer.
 * Usage: node voice-console/test-voice-command.js
 */
import { io } from 'socket.io-client';

const url = process.env.MINDSERVER_URL || 'http://localhost:8080';
const message = process.argv[2] || '@Aki 木を切って';

const socket = io(url);

socket.on('connect', () => {
    console.log(`Connected to ${url}`);
    console.log(`Emitting voice-command: ${message}`);
    socket.emit('voice-command', message);
    setTimeout(() => {
        socket.disconnect();
        process.exit(0);
    }, 500);
});

socket.on('connect_error', (err) => {
    console.error('Connection failed:', err.message);
    process.exit(1);
});
