// ============================================================
// server.js — Main Express Server
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend (public folder)
app.use(express.static(path.join(__dirname, "public")));

// ── Ensure uploads folder exists ────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Multer Configuration ─────────────────────────────────────
// Controls WHERE and HOW files are saved
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR); // Save to "uploads/" folder
  },
  filename: function (req, file, cb) {
    // Add timestamp to avoid duplicate filenames
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// File type validation — only images and PDFs allowed
const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only images (JPG, PNG, GIF, WEBP) and PDFs are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// ── Routes ───────────────────────────────────────────────────

// POST /upload — Upload a file
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }
  res.json({
    message: "File uploaded successfully!",
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

// GET /files — List all uploaded files
app.get("/files", (req, res) => {
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Could not read files." });
    }

    // Build file info array
    const fileList = files.map((filename) => {
      const filePath = path.join(UPLOADS_DIR, filename);
      const stats = fs.statSync(filePath);
      return {
        filename: filename,
        size: stats.size,
        uploadedAt: stats.birthtime,
      };
    });

    res.json(fileList);
  });
});

// GET /download/:filename — Download a specific file
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_DIR, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found." });
  }

  // Send file as download
  res.download(filePath, filename, (err) => {
    if (err) {
      res.status(500).json({ error: "Could not download file." });
    }
  });
});

// DELETE /file/:filename — Delete a specific file
app.delete("/file/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_DIR, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found." });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: "Could not delete file." });
    }
    res.json({ message: "File deleted successfully!" });
  });
});

// ── Error Handler for Multer ─────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large! Maximum size is 10MB." });
    }
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📁 Files stored in: ${UPLOADS_DIR}`);
});