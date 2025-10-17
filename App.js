import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001";

function App() {
  const [selected, setSelected] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState([]);

  // Fetch all files on load
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const res = await axios.get(`${API_BASE}/files`);
    setFiles(res.data);
  };

  const handleUpload = async () => {
    if (selected.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const form = new FormData();
    Array.from(selected).forEach((file) => form.append("files", file));

    try {
      setUploading(true);
      setProgress(0);
      await axios.post(`${API_BASE}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      alert("Upload successful!");
      setSelected([]);
      fetchFiles();
    } catch (err) {
      alert("Upload failed. See console for details.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this file?")) {
      await axios.delete(`${API_BASE}/delete/${id}`);
      fetchFiles();
    }
  };

  const handleDownload = (id) => {
    window.open(`${API_BASE}/download/${id}`, "_blank");
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>📂 File Upload Manager</h1>

      <input
        type="file"
        multiple
        onChange={(e) => setSelected(e.target.files)}
        style={{ marginBottom: "10px" }}
      />
      <br />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? `Uploading... ${progress}%` : "Upload Files"}
      </button>

      <hr />
      <h2>Uploaded Files</h2>

      {files.length === 0 && <p>No files uploaded yet.</p>}
      <ul>
        {files.map((file) => (
          <li key={file._id}>
            <strong>{file.filename}</strong> ({Math.round(file.size / 1024)} KB)
            <button
              onClick={() => handleDownload(file._id)}
              style={{ marginLeft: 10 }}
            >
              Download
            </button>
            <button
              onClick={() => handleDelete(file._id)}
              style={{ marginLeft: 10, color: "red" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
