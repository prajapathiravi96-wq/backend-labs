# Lab 2: SQLite Database and CRUD Routes

## Student Details

| Field               | Value            |
|---------------------|------------------|
| **Name**            | Ravi Prajapathi  |
| **Section**         | Computer Science |
| **Registration No** | 252U1R1201       |

---

## Live Link

> **Live on Render:** https://backend-labs-02.onrender.com
>
> | Route | Live URL |
> |-------|----------|
> | `GET /books/` | https://backend-labs-02.onrender.com/books/ |
> | `GET /books/:id/` | https://backend-labs-02.onrender.com/books/1/ |
> | `POST /books/` | https://backend-labs-02.onrender.com/books/ |
> | `PUT /books/:id/` | https://backend-labs-02.onrender.com/books/1/ |
> | `DELETE /books/:id/` | https://backend-labs-02.onrender.com/books/1/ |

---

## How to Run

### Prerequisites
- Node.js v18+
- SQLite3 CLI (optional, for manual DB inspection)

### Installation

```bash
cd lab-02
npm install
```

### Environment Variables

| Variable | Default | Description                    |
|----------|---------|--------------------------------|
| `PORT`   | `3001`  | Port the server listens on     |

### Start the Server

```bash
# Production
node app.js

# Development (auto-restart on file changes)
npm run dev
```

Expected output:
```
OK  Database seeded with 10 books.
OK  Server running on http://localhost:3001
```

---

## Endpoints

| Method | Path              | Description                              | Status |
|--------|-------------------|------------------------------------------|--------|
| GET    | `/books/`         | Return all books from the database       | 200    |
| GET    | `/books/:bookId/` | Return a single book by ID               | 200/404|
| POST   | `/books/`         | Add a new book (JSON body required)      | 201    |
| PUT    | `/books/:bookId/` | Update an existing book by ID            | 200/404|
| DELETE | `/books/:bookId/` | Delete a book by ID                      | 200/404|

### POST / PUT Request Body (JSON)

```json
{
  "title": "Book Title",
  "author": "Author Name",
  "price": 3000,
  "pages": 320
}
```

---

## Screenshots

Screenshots are stored in the [`screenshots/`](./screenshots/) directory.

| Route | File |
|-------|------|
| `GET /books/` | `screenshots/get-all-books.png` |
| `GET /books/1/` | `screenshots/get-book-by-id.png` |
| `POST /books/` | `screenshots/post-book.png` |
| `PUT /books/1/` | `screenshots/put-book.png` |
| `DELETE /books/1/` | `screenshots/delete-book.png` |
| 404 unknown route | `screenshots/404-handler.png` |

---

## Notes / Problems Faced

| Problem | Solution |
|---------|----------|
| Server must not start before DB connection succeeds | Used `initializeDBAndServer()` async function — `app.listen` called only after `await open()` resolves |
| Raw string SQL queries are vulnerable to injection | Used `?` placeholders in every query; never concatenated user input into SQL strings |
| Updating only some fields without overwriting others | Fetched existing row first, then merged request body fields with existing values before running UPDATE |
| SQLite `books.db` file should not be committed | Added `*.db` to `.gitignore`; DB is seeded automatically on first run |
| Needed the server to restart on every file change during development | Installed `nodemon` as devDependency; added `npm run dev` script |

