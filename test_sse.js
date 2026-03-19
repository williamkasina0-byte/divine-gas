import http from 'http';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, 'divine-secret-key-change-this', { expiresIn: '1h' });

const options = {
    hostname: 'localhost',
    port: 3002,
    path: `/api/admin/notifications/stream?token=${token}`,
    method: 'GET',
    headers: {
        'Accept': 'text/event-stream'
    }
};

console.log("Connecting to SSE stream...");
const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        console.log(`\n--- Received chunk ---\n${chunk.toString()}`);
    });

    res.on('end', () => {
        console.log('Stream ended');
    });
});

req.on('error', (e) => {
    console.error(`Problem:`, e);
});

req.end();
