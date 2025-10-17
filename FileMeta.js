import mongoose from "mongoose";

const FileMetaSchema = new mongoose.Schema({
  filename: String,
  path: String,
  mimetype: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("FileMeta", FileMetaSchema);
