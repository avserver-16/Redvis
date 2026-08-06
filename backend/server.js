const { spawn } = require('child_process');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path'); // Ensure this is imported at the top

const server = http.createServer();
const io = new Server(server, {
  cors: { 
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Fix: Point directly to the file inside the "redis engine" folder
const exePath = path.join(__dirname, '../RedisEngine', 'cache.exe');
const cppEngine = spawn(exePath);

// Absolute fallback error tracking
cppEngine.on('error', (err) => {
    console.error(`\nCRITICAL ERROR: Could not find or run the C++ engine!`);
    console.error(`Attempted Path: ${exePath}`);
    console.error(`System Error Message: ${err.message}\n`);
    process.exit(1);
});

// Buffer to safely manage incoming chunked data patterns across the system stdout stream
let dataBuffer = '';

cppEngine.stdout.on('data', (data) => {
    dataBuffer += data.toString();
    let boundary = dataBuffer.indexOf('\n');
    
    while (boundary !== -1) {
        const jsonLine = dataBuffer.substring(0, boundary).trim();
        dataBuffer = dataBuffer.substring(boundary + 1);
        
        if (jsonLine) {
            try {
                const parsedState = JSON.parse(jsonLine);
                // Broadcast structured payload to every connected dashboard user interface
                io.emit('CACHE_STATE_CHANGED', parsedState);
            } catch (err) {
                console.error("Failed parsing C++ output state structural JSON string: ", err);
            }
        }
        boundary = dataBuffer.indexOf('\n');
    }
});

cppEngine.stderr.on('data', (data) => {
    console.error(`C++ Engine Error Track logs: ${data}`);
});

// Manage React socket inputs
io.on('connection', (socket) => {
    console.log('React Frontend client connected to monitoring bridge');

    socket.on('EXECUTE_PUT', ({ key, value }) => {
        cppEngine.stdin.write(`PUT ${key} ${value}\n`);
    });

    socket.on('EXECUTE_GET', ({ key }) => {
        cppEngine.stdin.write(`GET ${key}\n`);
    });

    socket.on('SWITCH_POLICY', ({ policyType }) => {
        // Acceptable strings matching drivers: LRU, LFU, FIFO
        cppEngine.stdin.write(`POLICY ${policyType}\n`);
    });
});

server.listen(5000, () => {
    console.log('Cache bridge interface server active over http://localhost:5000');
});
