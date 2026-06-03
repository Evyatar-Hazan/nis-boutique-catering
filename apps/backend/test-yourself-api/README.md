# Test Yourself Server

This is the backend (server) for the Test Yourself app. It is built with Node.js and Express.

## Download

Clone this server project from GitHub:

```bash
git clone https://github.com/Evyatar-Hazan/test-yourself-server.git
cd test-yourself-server
```

**Client Repository**: The client is in a separate repository at:

```bash
git clone https://github.com/Evyatar-Hazan/test-yourself.git
```

## Dependencies

**Important:** This server is required for the Test Yourself Client to function properly.

1. **Client depends on this server** - The frontend makes API calls to this backend
2. **Must run before the client** - Start this server first, then the client
3. **Default port**: Server runs on port 5000
4. **CORS enabled** for local development with the client on port 3000

## Features

- REST API for tests, users, posts, and comments
- Serves static files and avatars
- Simple JSON-based data storage (for development)

## Project Structure

- `server.js` - Main server file
- `data/` - JSON files for storing app data
- `public/` - Static assets (avatars, etc.)

## How to Run

**Prerequisites:** Make sure you have Node.js installed on your system.

### Option 1: Run Server Only

```bash
git clone https://github.com/Evyatar-Hazan/test-yourself-server.git
cd test-yourself-server
npm install
node server.js
```

The server will run on [http://localhost:5000](http://localhost:5000).

### Option 2: Full Setup (Server + Client)

```bash
# Terminal 1 - Clone and Start Server (run this first)
git clone https://github.com/Evyatar-Hazan/test-yourself-server.git
cd test-yourself-server
npm install
node server.js

# Terminal 2 - Clone and Start Client (in a new terminal window)
git clone https://github.com/Evyatar-Hazan/test-yourself.git
cd test-yourself
npm install
npm start
```

**Note:** The client will be available on [http://localhost:3000](http://localhost:3000) after both are running.

## API Endpoints

- `/api/tests` - Get tests
- `/api/users` - Get users
- `/api/posts` - Get posts
- `/api/comments` - Get comments

## Notes

- Data is stored in JSON files for development. For production, consider using a database.
- CORS is enabled for local development with the client.

## Contact

For questions or issues, contact the repository owner.
