import jsonServer from "json-server";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const server = jsonServer.create();
const router = jsonServer.router(`db.json`);
const middlewares = jsonServer.defaults();

// Middlewares
server.use(cookieParser());
server.use(middlewares);
server.use(jsonServer.bodyParser);

// JWT Config
const SECRET_KEY = "secret-key";

// Custom Login Endpoint
server.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = router.db.get("users").find({ email }).value();

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    SECRET_KEY,
    { expiresIn: "1h" },
  );

  req.cookies = {
    token,
  };

  res.cookie("token", token, { httpOnly: true });

  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
  });
});

server.use((req, res, next) => {
  const publicRoutes = ["/login", "register", "/posts"];

  // Пропускаем публичные маршруты
  if (publicRoutes.includes(req.path)) return next();

  const token = req.cookies?.token;

  if (!token) {
    console.warn("Access attempt without token");
    return res.status(401).json({
      message: "Unauthorized - No token provided",
      hint: "Include credentials in your request",
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    console.log(`Authenticated user: ${decoded.userId}`);
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);

    const errorMessage =
      err.name === "TokenExpiredError"
        ? "Session expired - Please login again"
        : "Invalid token - Authentication failed";

    return res.status(401).json({
      message: errorMessage,
      error: err.name,
    });
  }
});

server.get("/posts/:id/full", (req, res) => {
  const postId = +req.params.id;
  const post = router.db.get("posts").getById(postId).value();

  if (!post) return res.status(404).json({ message: "Post not found" });

  const comments = router.db.get("comments").filter({ postId }).value();
  const likes = router.db.get("likes").filter({ postId }).value();

  res.json({
    ...post,
    comments,
    likesCount: likes.length,
    isLiked: likes.some((like) => like.userId === req.user?.userId),
  });
});

server.post("/posts/:id/like", (req, res) => {
  const postId = +req.params.id;
  const userId = req.user.userId;
  const likes = router.db.get("likes");

  const existingLike = likes.find({ postId, userId }).value();

  if (existingLike) {
    likes.remove({ id: existingLike.id }).write();
    return res.json({ liked: false });
  }

  const newLike = {
    id: Date.now(),
    postId,
    userId,
    createdAt: new Date().toISOString(),
  };

  likes.push(newLike).write();
  res.json({ liked: true, like: newLike });
});

// Default JSON Server router
server.use(router);

// Start Server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});
