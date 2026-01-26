const http = require('http');
const { URL } = require('url');
const { ObjectId } = require('mongodb');
const connectDB = require('./db');

const PORT = 5000;
let usersCollection;
let booksCollection;
let requestsCollection;
let borrowsCollection;
let favoritesCollection;
let notificationsCollection;

connectDB()
  .then((db) => {
    usersCollection = db.collection('users');
    booksCollection = db.collection('books');
    requestsCollection = db.collection('requests');
    borrowsCollection = db.collection('borrows');
    favoritesCollection = db.collection('favorites');
    notificationsCollection = db.collection('notifications');
    return seedUsers();
  })
  .then(() => {
    return seedBooks();
  })
  .then(() => {
    startServer();
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });

async function seedUsers() {
  const count = await usersCollection.countDocuments();
  if (count === 0) {
    await usersCollection.insertOne({ username: 'admin', password: 'admin123', role: 'admin' });
    console.log('Admin user seeded');
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function startServer() {
  http
    .createServer(async (req, res) => {
      // Allow CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Normalize path using WHATWG URL API
      const fullUrl = new URL(req.url, `http://${req.headers.host}`);
      const path = fullUrl.pathname.replace(/\/+$/, ''); // remove trailing slashes

      try {
        // -------- LOGIN --------
        if (path === '/api/login' && req.method === 'POST') {
          const body = await parseBody(req);
          const { username, password } = body;

          const user = await usersCollection.findOne({ username, password });
          if (user) {
            sendResponse(res, 200, {
              role: user.role,
              username: user.username,
              message: 'Login successful',
            });
          } else {
            sendResponse(res, 401, { message: 'Invalid credentials' });
          }
        }
        // -------- REGISTER STUDENT --------
        else if (path === '/api/register' && req.method === 'POST') {
          const body = await parseBody(req);
          const { username, password } = body;

          const existing = await usersCollection.findOne({ username });
          if (existing) {
            sendResponse(res, 400, { message: 'Username already exists' });
            return;
          }

          await usersCollection.insertOne({ username, password, role: 'student' });
          sendResponse(res, 200, { message: 'Student registered successfully' });
        }
        // -------- GET ALL BOOKS --------
        else if (path === '/api/books' && req.method === 'GET') {
          const books = await booksCollection.find({}).toArray();
          sendResponse(res, 200, books);
        }
        // -------- ADD BOOK --------
        else if (path === '/api/books' && req.method === 'POST') {
          const body = await parseBody(req);
          const { title, author } = body;

          if (!title || !author) {
            sendResponse(res, 400, { message: 'Title and author are required' });
            return;
          }

          const result = await booksCollection.insertOne({
            title,
            author,
            issued: false,
          });
          sendResponse(res, 201, { message: 'Book added successfully', id: result.insertedId });
        }
        // -------- DELETE BOOK --------
        else if (path.startsWith('/api/books/') && req.method === 'DELETE') {
          const id = path.split('/api/books/')[1];

          if (!ObjectId.isValid(id)) {
            sendResponse(res, 400, { message: 'Invalid book ID' });
            return;
          }

          const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
          if (result.deletedCount === 0) {
            sendResponse(res, 404, { message: 'Book not found' });
            return;
          }
          sendResponse(res, 200, { message: 'Book deleted successfully' });
        }
        // -------- ISSUE/RETURN BOOK --------
        else if (path.startsWith('/api/books/issue/') && req.method === 'PUT') {
          const id = path.split('/api/books/issue/')[1];

          if (!ObjectId.isValid(id)) {
            sendResponse(res, 400, { message: 'Invalid book ID' });
            return;
          }

          const book = await booksCollection.findOne({ _id: new ObjectId(id) });
          if (!book) {
            sendResponse(res, 404, { message: 'Book not found' });
            return;
          }

          await booksCollection.updateOne({ _id: new ObjectId(id) }, { $set: { issued: !book.issued } });
          sendResponse(res, 200, { message: `Book ${!book.issued ? 'issued' : 'returned'} successfully` });
        }
        // -------- REQUEST BOOK (STUDENT) --------
        else if (path.startsWith('/api/books/request/') && req.method === 'POST') {
          const id = path.split('/api/books/request/')[1];
          const body = await parseBody(req);
          const { username } = body;

          if (!ObjectId.isValid(id)) {
            sendResponse(res, 400, { message: 'Invalid book ID' });
            return;
          }

          if (!username) {
            sendResponse(res, 400, { message: 'Username is required' });
            return;
          }

          const book = await booksCollection.findOne({ _id: new ObjectId(id) });
          if (!book) {
            sendResponse(res, 404, { message: 'Book not found' });
            return;
          }

          // Check if already requested
          const existingRequest = await requestsCollection.findOne({
            bookId: id,
            username,
            status: 'pending',
          });
          if (existingRequest) {
            sendResponse(res, 400, { message: 'You have already requested this book' });
            return;
          }

          // Check if already borrowed
          const existingBorrow = await borrowsCollection.findOne({
            bookId: id,
            username,
            returned: false,
          });
          if (existingBorrow) {
            sendResponse(res, 400, { message: 'You have already borrowed this book' });
            return;
          }

          await requestsCollection.insertOne({
            bookId: id,
            username,
            bookTitle: book.title,
            bookAuthor: book.author,
            status: 'pending',
            requestedAt: new Date(),
          });

          sendResponse(res, 201, { message: 'Book request submitted successfully' });
        }
        // -------- GET MY REQUESTS (STUDENT) --------
        else if (path === '/api/books/my-requests' && req.method === 'GET') {
          const fullUrl = new URL(req.url, `http://${req.headers.host}`);
          const username = fullUrl.searchParams.get('username');

          if (!username) {
            sendResponse(res, 400, { message: 'Username is required' });
            return;
          }

          const requests = await requestsCollection.find({ username }).sort({ requestedAt: -1 }).toArray();
          sendResponse(res, 200, requests);
        }
        // -------- GET MY BORROWED BOOKS (STUDENT) --------
        else if (path === '/api/books/my-borrowed' && req.method === 'GET') {
          const fullUrl = new URL(req.url, `http://${req.headers.host}`);
          const username = fullUrl.searchParams.get('username');

          if (!username) {
            sendResponse(res, 400, { message: 'Username is required' });
            return;
          }

          const borrows = await borrowsCollection.find({ username, returned: false }).sort({ borrowedAt: -1 }).toArray();

          // Get book details
          const borrowedBooks = await Promise.all(
            borrows.map(async (borrow) => {
              const book = await booksCollection.findOne({ _id: new ObjectId(borrow.bookId) });
              return {
                ...borrow,
                book: book || { title: borrow.bookTitle, author: borrow.bookAuthor },
              };
            }),
          );

          sendResponse(res, 200, borrowedBooks);
        }
        // -------- GET MY FAVORITES (STUDENT) --------
        else if (path === '/api/books/my-favorites' && req.method === 'GET') {
          const fullUrl = new URL(req.url, `http://${req.headers.host}`);
          const username = fullUrl.searchParams.get('username');

          if (!username) {
            sendResponse(res, 400, { message: 'Username is required' });
            return;
          }

          const favorites = await favoritesCollection.find({ username }).toArray();
          const favoriteIds = favorites.map((f) => f.bookId);

          const books = await booksCollection
            .find({
              _id: { $in: favoriteIds.map((id) => new ObjectId(id)) },
            })
            .toArray();

          sendResponse(res, 200, books);
        }
        // -------- TOGGLE FAVORITE (STUDENT) --------
        else if (path.startsWith('/api/books/favorite/') && req.method === 'POST') {
          const id = path.split('/api/books/favorite/')[1];
          const body = await parseBody(req);
          const { username } = body;

          if (!ObjectId.isValid(id)) {
            sendResponse(res, 400, { message: 'Invalid book ID' });
            return;
          }

          if (!username) {
            sendResponse(res, 400, { message: 'Username is required' });
            return;
          }

          const existing = await favoritesCollection.findOne({ bookId: id, username });

          if (existing) {
            await favoritesCollection.deleteOne({ _id: existing._id });
            sendResponse(res, 200, { message: 'Removed from favorites', isFavorite: false });
          } else {
            const book = await booksCollection.findOne({ _id: new ObjectId(id) });
            if (!book) {
              sendResponse(res, 404, { message: 'Book not found' });
              return;
            }
            await favoritesCollection.insertOne({
              bookId: id,
              username,
              bookTitle: book.title,
              bookAuthor: book.author,
              addedAt: new Date(),
            });
            sendResponse(res, 200, { message: 'Added to favorites', isFavorite: true });
          }
        }
        // -------- GET ALL REQUESTS (ADMIN) --------
        else if (path === '/api/admin/requests' && req.method === 'GET') {
          const requests = await requestsCollection.find({}).sort({ requestedAt: -1 }).toArray();
          sendResponse(res, 200, requests);
        }
        // -------- APPROVE REQUEST (ADMIN) --------
        else if (path.startsWith('/api/admin/requests/') && path.endsWith('/approve') && req.method === 'PUT') {
          const id = path.split('/api/admin/requests/')[1].replace('/approve', '');

          if (!ObjectId.isValid(id)) {
            sendResponse(res, 400, { message: 'Invalid request ID' });
            return;
          }

          const request = await requestsCollection.findOne({ _id: new ObjectId(id) });
          if (!request) {
            sendResponse(res, 404, { message: 'Request not found' });
            return;
          }

          const book = await booksCollection.findOne({ _id: new ObjectId(request.bookId) });
          if (!book) {
            sendResponse(res, 404, { message: 'Book not found' });
            return;
          }

          if (book.issued) {
            sendResponse(res, 400, { message: 'Book is already issued' });
            return;
          }

          // Update request status
          await requestsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status: 'approved', approvedAt: new Date() } });

          // Mark book as issued
          await booksCollection.updateOne({ _id: new ObjectId(request.bookId) }, { $set: { issued: true } });

          // Create borrow record
          await borrowsCollection.insertOne({
            bookId: request.bookId,
            username: request.username,
            bookTitle: request.bookTitle,
            bookAuthor: request.bookAuthor,
            borrowedAt: new Date(),
            returned: false,
          });

          sendResponse(res, 200, { message: 'Request approved and book issued' });
        }
        // -------- REJECT REQUEST (ADMIN) --------
        else if (path.startsWith('/api/admin/requests/') && path.endsWith('/reject') && req.method === 'PUT') {
          const id = path.split('/api/admin/requests/')[1].replace('/reject', '');

          if (!ObjectId.isValid(id)) {
            sendResponse(res, 400, { message: 'Invalid request ID' });
            return;
          }

          const request = await requestsCollection.findOne({ _id: new ObjectId(id) });
          if (!request) {
            sendResponse(res, 404, { message: 'Request not found' });
            return;
          }

          await requestsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status: 'rejected', rejectedAt: new Date() } });

          sendResponse(res, 200, { message: 'Request rejected' });
        }
        // -------- GET BORROWERS STATS (ADMIN) --------
        else if (path === '/api/admin/borrowers' && req.method === 'GET') {
          const allBorrows = await borrowsCollection.find({ returned: false }).toArray();

          // Group by username
          const borrowerStats = {};
          allBorrows.forEach((borrow) => {
            if (!borrowerStats[borrow.username]) {
              borrowerStats[borrow.username] = {
                username: borrow.username,
                totalBorrowed: 0,
                books: [],
              };
            }
            borrowerStats[borrow.username].totalBorrowed++;
            borrowerStats[borrow.username].books.push({
              bookId: borrow.bookId,
              title: borrow.bookTitle,
              author: borrow.bookAuthor,
              borrowedAt: borrow.borrowedAt,
            });
          });

          const stats = Object.values(borrowerStats).sort((a, b) => b.totalBorrowed - a.totalBorrowed);
          sendResponse(res, 200, stats);
        }
        // -------- RETURN BORROWED BOOK (ADMIN) --------
        else if (path.startsWith('/api/admin/return/') && req.method === 'PUT') {
          const id = path.split('/api/admin/return/')[1];
          const body = await parseBody(req);
          const { username } = body;

          if (!ObjectId.isValid(id)) {
            sendResponse(res, 400, { message: 'Invalid book ID' });
            return;
          }

          if (!username) {
            sendResponse(res, 400, { message: 'Username is required' });
            return;
          }

          const borrow = await borrowsCollection.findOne({
            bookId: id,
            username,
            returned: false,
          });

          if (!borrow) {
            sendResponse(res, 404, { message: 'Borrow record not found' });
            return;
          }

          // Mark as returned
          await borrowsCollection.updateOne({ _id: borrow._id }, { $set: { returned: true, returnedAt: new Date() } });

          // Mark book as available
          await booksCollection.updateOne({ _id: new ObjectId(id) }, { $set: { issued: false } });

          // Create notification for the student
          await notificationsCollection.insertOne({
            username: username,
            type: 'return_request',
            message: `Please return the book "${borrow.bookTitle}" by ${borrow.bookAuthor}. The admin has marked it for return.`,
            bookId: id,
            bookTitle: borrow.bookTitle,
            bookAuthor: borrow.bookAuthor,
            read: false,
            createdAt: new Date(),
          });

          sendResponse(res, 200, { message: 'Book returned successfully' });
        }
        // -------- GET NOTIFICATIONS (STUDENT) --------
        else if (path === '/api/notifications' && req.method === 'GET') {
          const fullUrl = new URL(req.url, `http://${req.headers.host}`);
          const username = fullUrl.searchParams.get('username');

          if (!username) {
            sendResponse(res, 400, { message: 'Username is required' });
            return;
          }

          const notifications = await notificationsCollection.find({ username }).sort({ createdAt: -1 }).toArray();

          sendResponse(res, 200, notifications);
        }
        // -------- MARK NOTIFICATION AS READ (STUDENT) --------
        else if (path.startsWith('/api/notifications/') && path.endsWith('/read') && req.method === 'PUT') {
          const id = path.split('/api/notifications/')[1].replace('/read', '');

          if (!ObjectId.isValid(id)) {
            sendResponse(res, 400, { message: 'Invalid notification ID' });
            return;
          }

          await notificationsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { read: true, readAt: new Date() } });

          sendResponse(res, 200, { message: 'Notification marked as read' });
        }
        // -------- MARK ALL NOTIFICATIONS AS READ (STUDENT) --------
        else if (path === '/api/notifications/read-all' && req.method === 'PUT') {
          const body = await parseBody(req);
          const { username } = body;

          if (!username) {
            sendResponse(res, 400, { message: 'Username is required' });
            return;
          }

          await notificationsCollection.updateMany({ username, read: false }, { $set: { read: true, readAt: new Date() } });

          sendResponse(res, 200, { message: 'All notifications marked as read' });
        }
        // -------- NOT FOUND --------
        else {
          sendResponse(res, 404, { message: 'Not found' });
        }
      } catch (err) {
        console.error('Server error:', err);
        sendResponse(res, 500, { message: 'Server error', error: err.message });
      }
    })
    .listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}
