const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis").RedisStore; // v7+ exports default
const { createClient } = require("redis");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

// -------- Redis client --------
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});
redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.connect(); // node-redis v4 returns a promise (no await needed here)

// Create RedisStore using the factory function
// const RedisStore = createRedisStore(session);

// -------- Session middleware --------
app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: "sess:" }),
    secret: process.env.SESSION_SECRET || "super-secret-key-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // set secure:true if behind HTTPS
      secure: false,
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  })
);

// -------- App basics --------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

// ---- Demo “user store” (replace with DB in real apps) ----
/**
 * In memory user:
 * username: admin
 * password: admin123  (will be hashed on server start)
 */
let USERS = {};
(async () => {
  const hash = await bcrypt.hash("admin123", 10);
  USERS["admin"] = { username: "admin", passwordHash: hash };
})();

// -------- Auth helpers --------
function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  res.redirect("/login");
}

// -------- Routes --------
app.get("/", (req, res) => {
  res.redirect("/profile");
});

app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/profile");
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS[username];
  if (!user) return res.status(401).render("login", { error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).render("login", { error: "Invalid credentials" });

  req.session.user = { username };
  res.redirect("/profile");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

app.get("/profile", requireAuth, (req, res) => {
  res.render("profile", { user: req.session.user });
});

// Optional: basic register to add new users (in-memory)
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});
app.post("/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).render("register", { error: "All fields required" });
  if (USERS[username]) return res.status(400).render("register", { error: "User already exists" });
  USERS[username] = { username, passwordHash: await bcrypt.hash(password, 10) };
  res.redirect("/login");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));