const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// STORAGE LOCATION
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");   // folder name
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // unique name
    }
});

const upload = multer({ storage: storage });

// ACTUAL UPLOAD API
router.post("/upload-document", upload.single("file"), (req, res) => {
    try {
        return res.json({
            status: "success",
            filename: req.file.filename,
            message: "File uploaded successfully!",
        });
    } catch (err) {
        return res.status(500).json({ status: "failed", error: err.message });
    }
});

module.exports = router;
