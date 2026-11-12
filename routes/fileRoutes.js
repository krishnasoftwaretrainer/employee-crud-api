
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const router = express.Router();

// Upload folder
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const uniqueName = randomUUID() + extension;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// 1. Upload Single File
router.post('/upload/single', upload.single('file'), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            message: 'Please select a file'
        });
    }

    res.status(200).json({
        message: 'File uploaded successfully',
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size
    });
});

// 2. Upload Multiple Files
router.post('/upload/multiple', upload.array('files', 10), (req, res) => {

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            message: 'Please select files'
        });
    }

    const uploadedFiles = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size
    }));

    res.status(200).json({
        message: 'Files uploaded successfully',
        files: uploadedFiles
    });
});

// 3. Download File
router.get('/download/:filename', (req, res) => {

    const filename = req.params.filename;

    if (path.basename(filename) !== filename) {
        return res.status(400).json({
            message: 'Invalid filename'
        });
    }

    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            message: 'File not found'
        });
    }

    res.download(filePath, filename, (err) => {
        if (err && !res.headersSent) {
            res.status(500).json({
                message: 'File download failed'
            });
        }
    });
});

module.exports = router;
