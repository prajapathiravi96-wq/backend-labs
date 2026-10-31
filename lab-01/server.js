const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Request Logger Middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
  // Capture the original res.json / res.send to intercept the status code
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode}`);
    return originalSend(body);
  };
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /  →  Welcome text
app.get('/', (req, res) => {
  res.status(200).send('Welcome to Lab 1: Node.js and Express Server!');
});

// GET /about  →  JSON with name and section
app.get('/about', (req, res) => {
  res.status(200).json({
    name: 'Ravi Prajapathi',
    section: 'Computer Science',
  });
});

// GET /time  →  Current date and time
app.get('/time', (req, res) => {
  const currentTime = new Date();
  res.status(200).json({
    currentTime: currentTime.toString(),
    iso: currentTime.toISOString(),
  });
});

// ─── 404 Handler (must be placed after all routes) ───────────────────────────
app.use((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → 404`);
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `The path '${req.path}' does not exist on this server.`,
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`✅  Server running on ${host}`);
  console.log(`    Routes: GET /  |  GET /about  |  GET /time`);
});

