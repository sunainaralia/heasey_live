// Core Modules
import http from 'http';

import app from './app.js';
import { connectToMongo } from './Db.js';

const port = process.env.PORT || 3000;

// HTTPS setup (optional)

const server = http.createServer(app);
server.setTimeout(1000000);

(async () => {
    try {
        server.listen(port);
        await connectToMongo();
        console.log(`Server is running. (${port})`);
    } catch (error) {
        console.error("Error starting the server:", error);
    }
})();
