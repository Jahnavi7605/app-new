const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql');
const fs = require('fs');
const promClient = require('prom-client');
const register = new promClient.Registry();


const app = express();
const port = 3000;

// Create a Histogram to measure HTTP request duration
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'status'],
});

// Middleware for logging requests and measuring HTTP request duration
app.use((req, res, next) => {
  const start = Date.now();
  const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
  const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  
  // Log all requests
  logStream.write(logMessage);
  console.log(logMessage); // Log to console as well

  // Measure request duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, res.statusCode)
      .observe(duration / 1000);
  });

  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

// Create MySQL connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root', // Change to your MySQL username
    password: 'root', // Change to your MySQL password
    database: 'users' // Change to the name of your database
});

// Function to execute MySQL queries
function executeQuery(sql, values) {
    return new Promise((resolve, reject) => {
        pool.query(sql, values, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// Redirect root route to login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Serve login page
app.get('/login', (req, res) => {
    console.log(`[${new Date().toISOString()}] Serving login page`);
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve signup page
app.get('/signup', (req, res) => {
    console.log(`[${new Date().toISOString()}] Serving signup page`);
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
    console.log(`[${new Date().toISOString()}] Testing database connection`);
    try {
        const testResult = await executeQuery('SELECT 1');
        console.log(`[${new Date().toISOString()}] Database connection successful`);
        res.status(200).send('Database connection successful');
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error connecting to database: ${error}`);
        res.status(500).send('Failed to connect to database');
    }
});

// Serve about page
app.get('/about', (req, res) => {
    console.log(`[${new Date().toISOString()}] Serving about page`);
    res.sendFile(path.join(__dirname, 'webapp', 'about.html'));
});

// Serve acrylic paintings page
app.get('/acrylic-paintings', (req, res) => {
    console.log(`[${new Date().toISOString()}] Serving acrylic paintings page`);
    res.sendFile(path.join(__dirname, 'acrylic-paintings.html'));
});

// Serve abstract paintings page
app.get('/abstract-paintings', (req, res) => {
    console.log(`[${new Date().toISOString()}] Serving abstract paintings page`);
    res.sendFile(path.join(__dirname, 'abstract-paintings.html'));
});

// Add this route for serving the Boho Paintings page
app.get('/boho-paintings', (req, res) => {
    console.log(`[${new Date().toISOString()}] Serving Boho Paintings page`);
    res.sendFile(path.join(__dirname, 'boho-paintings.html'));
});

// Route for serving the cart page
app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'cart.html'));
});

// Define a route for the "Just Launched" page
app.get('/just-launched', (req, res) => {
    res.sendFile(path.join(__dirname, 'just-launched.html'));
});

// Define a route for the "Gallery Walls" page
app.get('/gallery-walls', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery-walls.html'));
});

// Define a route for the "Personalized Art" page
app.get('/personalized-art', (req, res) => {
    res.sendFile(path.join(__dirname, 'personalized-art.html'));
});


// Sign Up endpoint
app.post('/signup', async (req, res) => {
    const { username, email_id, password } = req.body; // Change 'email' to 'email_id'

    try {
        // Check if user already exists
        const existingUser = await executeQuery('SELECT * FROM login_details WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            console.error(`[${new Date().toISOString()}] User ${username} already exists`);
            return res.status(400).send('User already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        await executeQuery('INSERT INTO login_details (username, email_id, password) VALUES (?, ?, ?)', [username, email_id, hashedPassword]); // Change 'email' to 'email_id'
        console.log(`[${new Date().toISOString()}] User ${username} signed up successfully`);
        res.redirect('/login'); // Redirect to the login page after successful signup
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during sign up: ${error}`);
        res.status(500).send('Failed to sign up');
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user exists in the database
        const user = await executeQuery('SELECT * FROM login_details WHERE username = ?', [username]);

        // If user not found or password is incorrect, redirect back to login page
        if (user.length === 0 || !await bcrypt.compare(password, user[0].password)) {
            console.error(`[${new Date().toISOString()}] Invalid login attempt for user ${username}`);
            return res.redirect('/login');
        }

        // Set the username in the session to indicate user is logged in
        req.session.username = username;

        // Redirect to the dashboard after successful login
        console.log(`[${new Date().toISOString()}] User ${username} logged in successfully`);
        res.redirect('/dashboard');
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during login: ${error}`);
        res.status(500).send('Failed to login');
    }
});

// Logout endpoint
app.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Error logging out: ${err}`);
            return res.status(500).send('Error logging out');
        }
        console.log(`[${new Date().toISOString()}] User logged out successfully`);
        // Redirect to the login page after logout
        res.redirect('/login');
    });
});


// Dashboard endpoint
app.get('/dashboard', (req, res) => {
    // Check if user is authenticated (session exists)
    if (!req.session.username) {
        console.log(`[${new Date().toISOString()}] User not authenticated, redirecting to login page`);
        return res.redirect('/login');
    }
    // User is authenticated, render the dashboard
    console.log(`[${new Date().toISOString()}] User authenticated, rendering dashboard`);
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Get username endpoint
app.get('/get-username', (req, res) => {
    // Check if user is authenticated (session exists)
    if (!req.session.username) {
        console.log(`[${new Date().toISOString()}] User not authenticated`);
        return res.status(401).send('User not authenticated');
    }
    // User is authenticated, send the username
    console.log(`[${new Date().toISOString()}] Sending username: ${req.session.username}`);
    res.status(200).send(req.session.username);
});

// Expose Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(promClient.register.metrics());
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
