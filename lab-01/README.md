# Lab 1: Node.js and Express Server

## Student Details

| Field               | Value            |
|---------------------|------------------|
| **Name**            | Ravi Prajapathi  |
| **Section**         | Computer Science |
| **Registration No** | 252U1R1201       |

---

## Live Link

> Not applicable -- runs locally on `http://localhost:3000`.

---

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed

### Installation

```bash
# Navigate into the lab directory
cd lab-01

# Install dependencies
npm install
```

### Environment Variables

| Variable | Default | Description                    |
|----------|---------|--------------------------------|
| `PORT`   | `3000`  | Port the server will listen on |

Create a `.env` file if you want to override the default port:

```
PORT=4000
```

### Start the Server

```bash
node server.js
```

Expected output:

```
OK  Server running on http://localhost:3000
    Routes: GET /  |  GET /about  |  GET /time
```

---

## Endpoints

| Method | Path     | Description                                            |
|--------|----------|--------------------------------------------------------|
| GET    | `/`      | Returns a plain-text welcome message (status 200)      |
| GET    | `/about` | Returns JSON `{ name, section }` (status 200)          |
| GET    | `/time`  | Returns current date/time via `new Date()` (status 200)|
| *      | `/*`     | Custom 404 handler -- unknown path returns JSON error  |

---

## Screenshots

Output captures are stored in the [`screenshots/`](./screenshots/) directory.

| Route        | Text capture (auto-generated)       | Screenshot (manual)           |
|--------------|--------------------------------------|-------------------------------|
| `GET /`      | `screenshots/route-root.txt`        | `screenshots/route-root.png`  |
| `GET /about` | `screenshots/route-about.txt`       | `screenshots/route-about.png` |
| `GET /time`  | `screenshots/route-time.txt`        | `screenshots/route-time.png`  |
| Unknown path | `screenshots/route-404.txt`         | `screenshots/route-404.png`   |

---

## Notes / Problems Faced

| Problem | Solution |
|---------|----------|
| PowerShell does not support `&&` as a command separator | Used semicolons `;` or ran commands individually |
| Status code logging must happen after the route sets it | Wrapped `res.send` in a middleware that intercepts the call |
| `.gitignore` must exclude `node_modules/` and `.env` | Both entries added to `.gitignore` |
| `package.json` `scripts.start` could not be set via PowerShell JSON manipulation | Wrote `package.json` directly as a file |
