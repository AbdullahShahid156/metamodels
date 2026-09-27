const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { requireAuth, requireSeller } = require('../middleware/authMiddleware');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for now
});

// POST /api/ipfs/upload
router.post('/upload', requireAuth, requireSeller, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      return res.status(500).json({ error: 'Pinata configuration missing on server' });
    }

    // Create Form Data for Pinata
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
    });

    // Optional: Metadata for Pinata
    const metadata = JSON.stringify({
      name: req.file.originalname,
      keyvalues: {
        seller_id: req.user.id
      }
    });
    formData.append('pinataMetadata', metadata);

    // Optional: Pinata Options
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    // Send to Pinata
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey
      }
    });

    // Return the IPFS CID (Hash)
    res.json({
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp
    });

  } catch (err) {
    console.error('IPFS Upload Error:', err.response ? err.response.data : err.message);
    res.status(500).json({ 
      error: 'Failed to upload to IPFS', 
      details: err.response ? err.response.data : err.message 
    });
  }
});

module.exports = router;
