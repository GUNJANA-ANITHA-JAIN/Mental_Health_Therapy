// Import necessary modules
import './style.css'; // Link to your CSS file if necessary
import Experience from './Experience/Experience.js'; // Ensure the path to your Experience.js is correct
import { io } from 'socket.io-client'; // Import socket.io client

// Initialize the Experience (main 3D scene)
const experienceElement = document.querySelector('.experience');
if (experienceElement) {
    window.experience = new Experience({
        targetElement: experienceElement,
    });
}

// Initialize Socket.IO
const socket = io('http://localhost:3000');

// Handle successful connection
socket.on('connect', () => {
    console.log(`Connected as ${socket.id}`);

    // Notify the server of a new user
    socket.emit('newUser', { id: socket.id });
});

// Handle updates from the server
socket.on('updateState', (data) => {
    console.log('State Update:', data);

    // Sync other users' positions/actions in the 3D scene
    if (window.experience) {
        window.experience.updateOtherUsers(data);
    }
});
