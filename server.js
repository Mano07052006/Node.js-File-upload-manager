// server/server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import FileMeta from "./models/FileMeta.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// ✅ Enable CORS for React frontend
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Allow both React dev server ports
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Handle paths correctly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// ✅ MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/file_upload_manager", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({ storage });

// ✅ Upload endpoint
app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const files = req.files.map((f) => ({
      filename: f.filename,
      path: f.path,
      mimetype: f.mimetype,
      size: f.size,
    }));
    await FileMeta.insertMany(files);
    res.status(200).json({ message: "Files uploaded successfully", files });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// ✅ Get all uploaded files
app.get("/files", async (req, res) => {
  try {
    const files = await FileMeta.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Error fetching files", error: err.message });
  }
});

// ✅ Download a file by ID
app.get("/download/:id", async (req, res) => {
  try {
    const file = await FileMeta.findById(req.params.id);
    if (!file) return res.status(404).send("File not found");
    res.download(file.path, file.filename);
  } catch (err) {
    res.status(500).send("Download error");
  }
});

// ✅ Delete a file
app.delete("/delete/:id", async (req, res) => {
  try {
    const file = await FileMeta.findById(req.params.id);
    if (!file) return res.status(404).send("File not found");
    fs.unlinkSync(file.path);
    await FileMeta.findByIdAndDelete(req.params.id);
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running at: http://localhost:${PORT}`));
