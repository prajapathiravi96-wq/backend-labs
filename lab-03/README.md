# Lab 3: REST API, query parameters, validation, debugging

## Student Details

| Field               | Value            |
|---------------------|------------------|
| **Name**            | Ravi Prajapathi  |
| **Section**         | Computer Science |
| **Registration No** | 252U1R1201       |

---

## Live Link

> **Live on Render:** https://backend-labs-03.onrender.com
>
> | Route | Description / Example Live URL |
> |-------|--------------------------------|
> | `GET /books` | https://backend-labs-03.onrender.com/books |
> | `GET /books?search_q=Clean` | https://backend-labs-03.onrender.com/books?search_q=Clean |
> | `GET /books?order_by=price&order=DESC` | https://backend-labs-03.onrender.com/books?order_by=price&order=DESC |
> | `GET /books?min_price=2000&max_price=4000` | https://backend-labs-03.onrender.com/books?min_price=2000&max_price=4000 |
> | `GET /books/:bookId` | https://backend-labs-03.onrender.com/books/1 |

---

## How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed

### Installation

```bash
# Navigate to the lab-03 directory
cd lab-03

# Install dependencies
npm install
```

### Environment Variables

| Variable | Default | Description                |
|----------|---------|----------------------------|
| `PORT`   | `3002`  | Port the server listens on |

*(No `.env` file is required to run with defaults; configure `PORT` if needed).*

### Start the Server

```bash
# Production start
npm start
# or: node app.js

# Development (auto-restart with nodemon)
npm run dev
```

Expected output:
```
✅  Database seeded with 10 books.
✅  Server running on http://localhost:3002
```

---

## Endpoints Table

| Method | Path | Query / Body Params | Description | Success Code | Error Codes |
|--------|------|---------------------|-------------|--------------|-------------|
| GET | `/books` | `search_q`, `order_by`, `order`, `limit`, `offset`, `min_price`, `max_price` | List books with search, sort, filter & pagination | 200 OK | 400 Bad Request |
| GET | `/books/:bookId` | Path param: `bookId` | Fetch a single book by ID | 200 OK | 404 Not Found |
| POST | `/books` | Body: `{ title, author, price, pages }` | Add a new book (with input validation) | 201 Created | 400 Bad Request |
| PUT | `/books/:bookId` | Path: `bookId`, Body: `{ title?, author?, price?, pages? }` | Update an existing book | 200 OK | 400 / 404 |
| DELETE | `/books/:bookId` | Path param: `bookId` | Delete a book by ID | 200 OK | 404 Not Found |

### Supported Query Parameters for `GET /books`
- `search_q`: Partial title match using SQL `LIKE %query%` (default: match all)
- `order_by`: Field to sort by: `id`, `title`, `author`, `price`, `pages` (default: `id`)
- `order`: Sort direction: `ASC` or `DESC` (default: `ASC`)
- `limit`: Number of records returned per page (default: `10`)
- `offset`: Number of records skipped for pagination (default: `0`)
- `min_price` & `max_price`: Filter price range using SQL `BETWEEN ? AND ?`

### Consistent JSON Error Responses
Every error response returns a consistent JSON object:
```json
{
  "message": "Detailed description of error"
}
```

---

## Debugging Exercise

In this lab, the faculty provided a broken version of the server containing common backend bugs. Here are the diagnostics and solutions:

| Bug Encountered | Root Cause | Solution Applied |
|-----------------|------------|------------------|
| **1. Port Conflict (`EADDRINUSE`)** | Another process (or previous server instance) was already occupying port `3000`. | Read port dynamically via `process.env.PORT \|\| 3002`, or terminated zombie node processes using PowerShell `Stop-Process`. |
| **2. Wrong Import Path** | `require('../app')` was used instead of `./app`, or wrong filename causing `MODULE_NOT_FOUND`. | Verified exact relative path `./app.js` and ensured correct module exports and imports. |
| **3. Table Name Typo (`no such table`)** | SQL queries referenced `FROM books` instead of `FROM book` (plural vs singular). | Aligned table schema definition (`CREATE TABLE book`) and all SQL queries to use the exact table name `book`. |
| **4. Missing `await` in DB Call** | Calling `const books = db.all(...)` without `await` resulted in sending an unresolved `Promise` object rather than data. | Added `await` before asynchronous SQLite operations (`await db.all()`, `await db.get()`, `await db.run()`). |

---

## Viva Questions & Answers

### 1. Query parameter vs Path parameter?
- **Path parameters** (e.g. `/books/:bookId`) identify a specific, unique resource in the URI hierarchy.
- **Query parameters** (e.g. `/books?order_by=price&order=DESC`) are key-value pairs used to sort, filter, search, or paginate a collection without changing the resource identity.

### 2. What does stateless mean?
- A REST API is **stateless** because the server does not store any client session state between requests. Every request from the client must contain all the information necessary for the server to understand and process it.

### 3. Which status code for bad input vs a missing record?
- **400 Bad Request:** Used when client input is invalid, malformed, or missing required fields (e.g., non-numeric price or empty title).
- **404 Not Found:** Used when the requested resource or ID does not exist in the database or server path.

---

## Screenshots

Output captures are stored in the [`screenshots/`](./screenshots/) directory.

| Test Case | Description | Output Capture | Screenshot (Manual) |
|-----------|-------------|----------------|---------------------|
| `GET /books` | List books with default limit & order | `screenshots/get-books.txt` | `screenshots/get-books.png` |
| `GET /books?search_q=Clean` | Search books by partial title | `screenshots/get-books-search.txt` | `screenshots/get-books-search.png` |
| `GET /books?min_price=2000&max_price=4000` | Filter books within price range | `screenshots/get-books-filter.txt` | `screenshots/get-books-filter.png` |
| `GET /books?order_by=price&order=DESC` | Sort books descending by price | `screenshots/get-books-sort.txt` | `screenshots/get-books-sort.png` |
| `POST /books (Valid)` | Create a new book (201 Created) | `screenshots/post-book-success.txt` | `screenshots/post-book-success.png` |
| `POST /books (Invalid)` | Reject missing title / non-numeric price (400) | `screenshots/post-book-fail-400.txt` | `screenshots/post-book-fail-400.png` |
| `GET /books/999` | Query non-existent ID (404 Not Found) | `screenshots/get-book-404.txt` | `screenshots/get-book-404.png` |
| `PUT /books/:id` | Update an existing book (200 OK) | `screenshots/put-book-success.txt` | `screenshots/put-book-success.png` |
| `DELETE /books/:id` | Remove a book (200 OK) | `screenshots/delete-book-success.txt` | `screenshots/delete-book-success.png` |

---

## Notes / Problems Faced

| Problem | Solution |
|---------|----------|
| SQL Injection vulnerability when interpolating `order_by` or `order` columns | Whitelisted safe column names (`id`, `title`, `author`, `price`, `pages`) and sort directions (`ASC`, `DESC`) before interpolating into the SQL string. |
| Ensuring parameter order matches dynamic WHERE clauses | Stored conditions and parameters in aligned arrays and joined them with `AND`. |
| Render deployment native glibc compatibility with `sqlite3` | Pinned `sqlite3` to exact version `5.1.7` to prevent `GLIBC_2.38 not found` errors on Render's Ubuntu 22.04 LTS runner. |
| Consistent error responses across all failure states | Standardized all error messages to return `{ "message": "..." }` format. |
