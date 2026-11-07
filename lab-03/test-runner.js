const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3002';
const screenshotsDir = path.join(__dirname, 'screenshots');

async function run() {
  console.log('\n==========================================================');
  console.log('   Lab 3 - REST API Automated Verification (Node.js)     ');
  console.log('==========================================================\n');

  // Wait for server to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      const res = await fetch(`${BASE}/books`);
      if (res.ok) break;
    } catch (e) {
      retries--;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const tests = [
    {
      name: '1. GET /books (Default limit & order)',
      url: `${BASE}/books`,
      options: { method: 'GET' },
      expectedStatus: 200,
      file: 'get-books.txt',
    },
    {
      name: '2. GET /books?search_q=Clean (Search by title)',
      url: `${BASE}/books?search_q=Clean`,
      options: { method: 'GET' },
      expectedStatus: 200,
      file: 'get-books-search.txt',
    },
    {
      name: '3. GET /books?min_price=2000&max_price=4000 (Price filter)',
      url: `${BASE}/books?min_price=2000&max_price=4000`,
      options: { method: 'GET' },
      expectedStatus: 200,
      file: 'get-books-filter.txt',
    },
    {
      name: '4. GET /books?order_by=price&order=DESC (Sorting)',
      url: `${BASE}/books?order_by=price&order=DESC`,
      options: { method: 'GET' },
      expectedStatus: 200,
      file: 'get-books-sort.txt',
    },
    {
      name: '5. GET /books/1 (Fetch single book)',
      url: `${BASE}/books/1`,
      options: { method: 'GET' },
      expectedStatus: 200,
      file: 'get-book-by-id.txt',
    },
    {
      name: '6. POST /books (Valid creation)',
      url: `${BASE}/books`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Refactoring',
          author: 'Martin Fowler',
          price: 4200,
          pages: 448,
        }),
      },
      expectedStatus: 201,
      file: 'post-book-success.txt',
    },
    {
      name: '7. POST /books (Invalid - non-numeric price)',
      url: `${BASE}/books`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Free Book',
          author: 'Anon',
          price: 'invalid_price',
          pages: 100,
        }),
      },
      expectedStatus: 400,
      file: 'post-book-fail-400.txt',
    },
    {
      name: '8. PUT /books/1 (Update book price)',
      url: `${BASE}/books/1`,
      options: {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: 4999 }),
      },
      expectedStatus: 200,
      file: 'put-book-success.txt',
    },
    {
      name: '9. DELETE /books/10 (Remove book)',
      url: `${BASE}/books/10`,
      options: { method: 'DELETE' },
      expectedStatus: 200,
      file: 'delete-book-success.txt',
    },
    {
      name: '10. GET /books/999 (Non-existent ID 404)',
      url: `${BASE}/books/999`,
      options: { method: 'GET' },
      expectedStatus: 404,
      file: 'get-book-404.txt',
    },
    {
      name: '11. GET /non-existent-route (404 handler)',
      url: `${BASE}/non-existent-route`,
      options: { method: 'GET' },
      expectedStatus: 404,
      file: '404-handler.txt',
    },
  ];

  let passCount = 0;
  for (const t of tests) {
    try {
      const res = await fetch(t.url, t.options);
      const text = await res.text();
      const statusMatch = res.status === t.expectedStatus;
      if (statusMatch) passCount++;

      const logStatus = statusMatch ? 'PASS' : 'FAIL';
      console.log(`[${logStatus}] ${t.name} -> HTTP ${res.status} (Expected: ${t.expectedStatus})`);

      // Write snapshot to screenshots directory
      const content = `HTTP ${res.status}\n${text}`;
      fs.writeFileSync(path.join(screenshotsDir, t.file), content, 'utf8');
    } catch (err) {
      console.log(`[FAIL] ${t.name} -> ERROR: ${err.message}`);
    }
  }

  console.log(`\nResults: ${passCount}/${tests.length} tests passed.\n`);
  if (passCount !== tests.length) process.exit(1);
}

run();
