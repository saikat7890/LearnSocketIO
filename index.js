import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

//open the database file
const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
});
await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
    );
`);

const app = express();
const server = createServer(app);
const io = new Server(server,  {
    connectionStateRecovery: {}
});

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '/view/index.html'));
});

io.on('connection', async (socket) => {
    console.log('A user connected with id: '+socket.id);
    socket.on('disconnect', () => { console.log("user disconnected")});

    socket.on('chatMsg Event', async (msg) => {
        console.log("message: " + msg);
        let result;
        try {
            result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
        } catch (err) {
            console.log("TODO handle the failure");
            return;
        }
        io.emit('chatMsg Event', msg, result.lastID);  // broadcasting
    });

    if(!socket.recovered) {
        try {
            await db.each('SELECT id, content FROM messages WHERE id > ?',
                [socket.handshake.auth.serverOffset || 0],
                (_err, row) => {
                    socket.emit('chatMsg Event', row.content, row.id);
                }
            )
        } catch (error) {
            console.log("Something went wrong");
        }
    }

    // // Acknowledgements with callback function- From client to server
    // socket.on('req', (arg1, arg2, callback) => {
    //     console.log(arg1);
    //     console.log(arg2);
    //     callback({
    //         status: '200ok'
    //     });
    // });

    // Acknowledgements with a Promise- From server to client
    // try {
    //     const response = await socket.timeout(5000).emitWithAck('request', {Acknowledgement: 'req emitted from server.'});
    //     console.log(response.status);
    // } catch (error) {
    //     console.log("the client did not acknowledge the event");
    // }

    // socket.emit('hello', 1 , '2', {3: '4', 5: Buffer.from([6]) });

    // Volatile Events
    // socket.on('ping', (count) => {
    //     console.log(count);
    // });
});
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');   
});