// ============================================================
// server.js — CloudVault with Share Code System
// ============================================================

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Folders ──────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "uploads");
const CODES_FILE  = path.join(__dirname, "codes.json");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(CODES_FILE))  fs.writeFileSync(CODES_FILE, JSON.stringify({}));

// ── Helpers ───────────────────────────────────────────────────
function loadCodes() {
  try { return JSON.parse(fs.readFileSync(CODES_FILE, "utf8")); }
  catch { return {}; }
}

function saveCodes(codes) {
  fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function uniqueCode() {
  const codes = loadCodes();
  let code;
  do { code = generateCode(); } while (codes[code]);
  return code;
}

// ── Multer Setup ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg","image/png","image/gif","image/webp","application/pdf"];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only images and PDFs allowed!"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Routes ────────────────────────────────────────────────────

// POST /upload — upload file, get back a share code
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const code  = uniqueCode();
  const codes = loadCodes();

  codes[code] = {
    filename:     req.file.filename,
    originalName: req.file.originalname,
    size:         req.file.size,
    uploadedAt:   new Date().toISOString()
  };
  saveCodes(codes);

  res.json({ message: "Uploaded!", code, filename: req.file.filename,
             originalName: req.file.originalname, size: req.file.size });
});

// GET /files — list all files with their codes
app.get("/files", (req, res) => {
  const codes = loadCodes();
  const list  = Object.entries(codes)
    .map(([code, info]) => ({ code, ...info }))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json(list);
});

// GET /access/:code — look up a file by share code
app.get("/access/:code", (req, res) => {
  const code  = req.params.code.toUpperCase().trim();
  const codes = loadCodes();
  if (!codes[code]) return res.status(404).json({ error: "Invalid code. No file found." });
  const filePath = path.join(UPLOADS_DIR, codes[code].filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File no longer exists." });
  res.json({ code, ...codes[code] });
});

// GET /download/:filename — download a file
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found." });
  res.download(filePath);
});

// DELETE /file/:code — delete file by its code
app.delete("/file/:code", (req, res) => {
  const code  = req.params.code.toUpperCase().trim();
  const codes = loadCodes();
  if (!codes[code]) return res.status(404).json({ error: "Code not found." });
  const filePath = path.join(UPLOADS_DIR, codes[code].filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  delete codes[code];
  saveCodes(codes);
  res.json({ message: "Deleted!" });
});

// ── Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ error: "File too large! Max 10MB." });
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));