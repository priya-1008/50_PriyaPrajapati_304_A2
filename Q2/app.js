const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({extended : true}));

app.use(
    session({
        store : new FileStore({ path : './session'}),
        secret : 'your-secret-key',
        resave : false,
        saveUninitialized : false,
        cookie : {maxAge : 3600000},
    })
);

const USER = {
    username : 'admin',
    password : 'admin123',
};

app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Login</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #74ebd5, #ACB6E5);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .login-container {
          background: #fff;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 6px 15px rgba(0,0,0,0.15);
          width: 350px;
          text-align: center;
        }
        h2 {
          margin-bottom: 20px;
          color: #333;
        }
        input {
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 14px;
        }
        button {
          width: 100%;
          padding: 12px;
          background: #4CAF50;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        button:hover {
          background: #43a047;
        }
        a {
          display: inline-block;
          margin-top: 12px;
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h2>Login Page</h2>
        <form method="POST" action="/login">
          <input name="username" type="text" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

app.post('/login',(req,res) => {
    const {username,password} = req.body;

    if (username === USER.username && password === USER.password) {
        req.session.user = username;
        return res.redirect('/dashboard');
    }
    res.send('Invalid Credentials. <a href="/">Try Again.</a>');
});

function authMiddelware(req,res,next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/');
}

app.get('/dashboard', authMiddelware, (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Dashboard</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f9;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .dashboard-container {
          background: #fff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 6px 15px rgba(0,0,0,0.15);
          text-align: center;
          width: 400px;
        }
        h2 {
          color: #2c3e50;
          margin-bottom: 10px;
        }
        h4 {
          color: #555;
          margin-bottom: 20px;
        }
        a {
          display: inline-block;
          padding: 12px 20px;
          background: #e74c3c;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          transition: background 0.3s ease;
        }
        a:hover {
          background: #c0392b;
        }
      </style>
    </head>
    <body>
      <div class="dashboard-container">
        <h2>Welcome, ${req.session.user}</h2>
        <h4>This is your Dashboard!!!</h4>
        <a href="/logout">Logout</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/logout',(req,res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});