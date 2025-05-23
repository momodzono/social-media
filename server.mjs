import jsonServer from "json-server";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(`db.json`);
const middlewares = jsonServer.defaults();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "files");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// Настройка multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 2MB
  },
});

// Middlewares
server.use(express.static("files"));
server.use("/files", express.static("files"));
server.use(cookieParser());
server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use(bodyParser.urlencoded({ extended: true }));

// JWT Config
const SECRET_KEY = "secret-key";

server.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const user = router.db.get("users").find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
});

server.get("/profile", getProfileData);

server.get("/profile/posts", getProfilePosts);

server.get("/profile/info", (req, res) => {
  const profile = getProfileData(req);
  const posts = getProfilePosts(req);
  res.json({ profile, posts });
});

server.get("/posts", (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  let userId = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      userId = decoded.userId;
    } catch (err) {
      console.error("Error verifying token:", err);
    }
  }

  const posts = router.db.get("posts").value();
  const likes = router.db.get("likes").value();
  const users = router.db.get("users").value();

  const postsWithLikesAndUsers = posts.map((post) => {
    const postLikes = likes.filter((like) => like.postId === post.id);
    const isLiked = userId
      ? postLikes.some((like) => like.userId === userId)
      : false;

    const postUser = users.find((user) => user.id === post.userId);

    return {
      ...post,
      username: postUser ? postUser.name : "Неизвестный пользователь",
      userEmail: postUser ? postUser.email : "",
      likesCount: postLikes.length,
      isLiked,
    };
  });

  res.json(postsWithLikesAndUsers);
});

server.post("/posts/:id/like", (req, res) => {
  const postId = parseInt(req.params.id);
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    const post = router.db.get("posts").find({ id: postId }).value();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likes = router.db.get("likes");
    const existingLike = likes.find({ postId, userId }).value();

    let liked = false;
    let likesCount = null;

    if (existingLike) {
      likes.remove({ id: existingLike.id }).write();
    } else {
      likes
        .push({
          id: Date.now(),
          postId,
          userId,
          createdAt: new Date().toISOString(),
        })
        .write();
      liked = true;
    }

    likesCount = likes.filter({ postId }).value().length;

    res.json({ liked, likesCount });
  } catch (err) {
    console.error("Error in like endpoint:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
});

server.post("/userprofile", upload.single("photo"), (req, res) => {
  // Сначала проверяем авторизацию
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }
  const file = req.file;
  // Проверяем JWT токен
  const decoded = jwt.verify(token, SECRET_KEY);
  const userId = decoded.userId;

  // Получаем данные из формы
  const { name, birthday, description } = req.body;
  const photoFile = req.body.photo;

  if (!name || !birthday) {
    // Удаляем загруженный файл, если валидация не прошла
    if (photoFile) {
      fs.unlink(photoFile.path, () => {});
    }
    return res.status(400).json({ message: "Заполните обязательные поля" });
  }

  const profiles = router.db.get("profiles");
  const existingProfile = profiles.find({ userId }).value();

  if (existingProfile) {
    if (photoFile) {
      fs.unlink(photoFile.path, () => {});
    }
    return res.status(400).json({ message: "Профиль уже существует" });
  }

  // Создаем запись в БД
  const newProfileInfo = {
    id: Date.now(),
    name,
    birthday,
    description: description || "",
    photo: file ? `http://localhost:3001/files/${file.filename}` : null,
    userId,
    createdAt: new Date().toISOString(),
  };

  profiles.push(newProfileInfo).write();

  res.status(201).json(newProfileInfo);
});

server.put("/profile/edit", upload.single("photo"), (req, res) => {
  // Сначала проверяем авторизацию
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }
  const file = req.file;
  if (file) req.body.photo = `http://localhost:3001/files/${file.filename}`;

  // Проверяем JWT токен
  const decoded = jwt.verify(token, SECRET_KEY);
  const userId = decoded.userId;

  const editprofiles = router.db.get("profiles");
  const existingEditProfile = editprofiles.find({ userId }).value();

  // if (file && existingEditProfile.photo) {
  //   const oldFilename = existingEditProfile.photo.split("/").pop();
  //   fs.unlink(`./uploads/${oldFilename}`, (err) => {
  //     if (err) console.error("Ошибка удаления старого файла:", err);
  //   });
  // }

  // Создаем запись в БД
  const UpdateProfileInfo = {
    ...existingEditProfile,
    ...req.body,
    updateAt: new Date().toISOString(),
  };
  console.log("UpdateProfileInfo", UpdateProfileInfo, req.body);

  editprofiles.find({ userId }).assign(UpdateProfileInfo).write();

  res.status(201).json(UpdateProfileInfo);
});

server.post("/addpost", (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ message: "Текст поста обязателен" });
    }

    const posts = router.db.get("posts");
    const newPost = {
      id: Date.now(),
      body,
      userId,
      createdAt: new Date().toISOString(),
      likes: null,
    };

    posts.push(newPost).write();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Ошибка при создании поста:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

server.delete("/posts", (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;
    const postId = Number(req.body.postId);

    if (isNaN(postId)) {
      return res.status(400).json({ message: "Некорректный ID поста" });
    }

    const posts = router.db.get("posts");
    const postToDelete = posts.find({ id: postId }).value();

    if (!postToDelete) {
      return res.status(404).json({ message: "Пост не найден" });
    }

    // Проверяем, что пост принадлежит пользователю
    if (postToDelete.userId !== userId) {
      return res.status(403).json({ message: "Нельзя удалить чужой пост" });
    }

    // Удаляем пост
    posts.remove({ id: postId }).write();

    res.status(200).json({ message: "Пост успешно удалён" });
  } catch (err) {
    console.error("Ошибка при удалении поста:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Custom Register Endpoint
server.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const users = router.db.get("users");
  const existingUser = users.find({ email }).value();

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = {
    id: Date.now(),
    email,
    password,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser).write();

  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email },
    SECRET_KEY,
    { expiresIn: "1h" },
  );

  res.cookie("token", token, { httpOnly: true });
  res.json({
    user: {
      id: newUser.id,
      email: newUser.email,
    },
    token,
  });
});

server.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// Login Endpoint
server.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = router.db.get("users").find({ email }).value();

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, {
    expiresIn: "1h",
  });

  res.cookie("token", token, { httpOnly: true });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  });
});

// Auth Middleware
server.use((req, res, next) => {
  const publicRoutes = ["/login", "/register", "/posts"];
  const isPostsLikeRoute = req.path.match(/^\/posts\/\d+\/like$/);

  if (publicRoutes.includes(req.path) || isPostsLikeRoute) return next();

  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    console.log(`Authenticated user: ${decoded.userId}`);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

// Protected Routes Example
server.get("/me", (req, res) => {
  const user = router.db.get("users").getById(req.user.userId).value();
  res.json(user);
});

function getProfileData(req, res, next) {
  let userId;
  const token = req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      userId = decoded.userId;
    } catch (err) {
      return next(err);
    }
  }
  console.log("userId", userId);

  const profile = router.db.get("profiles").find({ userId }).value();
  if (!profile) {
    return res.status(404).json({ message: "User not found" });
  }

  if (res) res.json(profile);
  else return profile; // Для использования в /profile/info
}

function getProfilePosts(req, res, next) {
  let userId;
  const token = req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      userId = decoded.userId;
    } catch (err) {
      return next(err);
    }
  }

  const userPosts = router.db.get("posts").filter({ userId }).value();
  const likes = router.db.get("likes").value();
  const users = router.db.get("users").value();

  const postsWithLikes = userPosts.map((post) => ({
    ...post,
    username: users.find((u) => u.id === post.userId)?.name || "Unknown",
    userEmail: users.find((u) => u.id === post.userId)?.email || "",
    likesCount: likes.filter((like) => like.postId === post.id).length,
    isLiked: userId
      ? likes.some((like) => like.postId === post.id && like.userId === userId)
      : false,
  }));

  if (res) res.json(postsWithLikes);
  else return postsWithLikes; // Для /profile/info
}

// Default JSON Server router
server.use(router);

// Start Server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
