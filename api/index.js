const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Jimp } = require('jimp');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(cors({
  origin: 'https://campus-lost-and-found-amber.vercel.app',
  credentials: true // Add this if you plan to use cookies or authorization headers
}));

app.use(express.json());
// ==========================================
// FEATURE 1: User Profile & Public Contact
// ==========================================
const userProfiles = new Map();
// Seed with a test user for demonstration purposes
userProfiles.set('student123', {
  email: 'student@university.edu',
  whatsapp: '+1234567890'
});

// ==========================================
// FEATURE 2: Media Uploads (Multer Integration)
// ==========================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Cryptographic time-hash prefix to avoid collisions
    const hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${hash}${ext}`);
  }
});
const upload = multer({ storage: storage });

// Helper: Generate Perceptual Hash (Feature 4)
async function generateImageHash(filePath) {
  try {
    const image = await Jimp.read(filePath);
    image.resize({ w: 8, h: 8 }).greyscale();
    
    let pixels = [];
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      pixels.push(this.bitmap.data[idx]);
    });
    
    const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
    return pixels.map(p => (p >= avg ? '1' : '0')).join('');
  } catch (err) {
    console.error('Error generating hash:', err);
    return null;
  }
}

// Helper: Calculate Hamming distance
function hammingDistance(hash1, hash2) {
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

// ==========================================
// FEATURE 6: Automated Expiry & Archiving
// ==========================================
setInterval(async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.item.updateMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        status: 'ACTIVE'
      },
      data: { status: 'ARCHIVED' }
    });
    console.log(`Archived ${result.count} old items.`);
  } catch (err) {
    console.error('Archiving job error:', err);
  }
}, 1000 * 60 * 60); // Run every hour

// ==========================================
// FEATURE 7: Domain-Restricted Auth Guard
// ==========================================
const authGuard = (req, res, next) => {
  const email = req.body.email || req.query.email;
  // Simple check for demonstration. In reality, would extract from JWT.
  if (email && !/^[a-zA-Z0-9._%+-]+@(.*?\.)?university\.edu$/i.test(email)) {
    return res.status(403).json({ error: 'Forbidden: University email required.' });
  }
  next();
};

// ==========================================
// FEATURE 9: Input Sanitization Middleware
// ==========================================
const sanitizeInput = [
  body('name').optional().escape(),
  body('description').optional().escape(),
  body('location').optional().escape(),
  body('category').optional().escape(),
  body('hiddenDescriptor').optional().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];


// ==========================================
// ENDPOINTS
// ==========================================

// FEATURE 3: Smart Categorization & Faceted Filters
app.get('/api/items', async (req, res) => {
  const { category, location, status } = req.query;
  
  const filters = { claimed: false, status: status || 'ACTIVE' };
  if (category) filters.category = category;
  if (location) filters.location = { contains: location };

  try {
    const items = await prisma.item.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' }
    });

    // F1: Attach user profile contact info
    const enrichedItems = items.map(item => {
      const profile = item.userId ? userProfiles.get(item.userId) : null;
      return { ...item, contactInfo: profile };
    });

    res.json(enrichedItems);
  } catch (error) {
    console.error('GET /api/items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// FEATURE 5: Interactive Spatial Mapping & Clustering
app.get('/api/items/spatial-clusters', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { status: 'ACTIVE', claimed: false, lat: { not: null }, lng: { not: null } }
    });

    const clusters = {};
    items.forEach(item => {
      const roundLat = Math.round(item.lat * 1000) / 1000;
      const roundLng = Math.round(item.lng * 1000) / 1000;
      const key = `${roundLat},${roundLng}`;
      if (!clusters[key]) clusters[key] = { lat: roundLat, lng: roundLng, count: 0, items: [] };
      clusters[key].count++;
      clusters[key].items.push(item.id);
    });

    res.json(Object.values(clusters));
  } catch (err) {
    res.status(500).json({ error: 'Spatial mapping failed' });
  }
});

// Get single item by ID (for QR code landing page)
app.get('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const profile = item.userId ? userProfiles.get(item.userId) : null;
    res.json({ ...item, contactInfo: profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create item (With F7 Auth Guard & F9 Sanitization)
app.post('/api/items', upload.single('image'), authGuard, sanitizeInput, async (req, res) => {
  const { type, name, description, location, date, category, hiddenDescriptor, email } = req.body;
  let lat = req.body.lat ? parseFloat(req.body.lat) : null;
  let lng = req.body.lng ? parseFloat(req.body.lng) : null;
  
  let imageUrl = null;
  let imageHash = null;
  
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
    imageHash = await generateImageHash(path.join(__dirname, 'uploads', req.file.filename));
  }

  // F1: Mock user assignment for demo
  let userId = 'student123'; 
  if (email) {
    userProfiles.set(userId, { email, whatsapp: '+0000000000' });
  }

  try {
    const item = await prisma.item.create({
      data: {
        type, name, description, location,
        date: new Date(date), category,
        lat, lng, hiddenDescriptor,
        imageUrl, imageHash, userId
      }
    });
    res.json(item);
  } catch (error) {
    console.error('POST /api/items error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// NEW FEATURE: Global Reverse Image Search
app.post('/api/items/search-by-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const uploadedImagePath = path.join(__dirname, 'uploads', req.file.filename);
    const targetHash = await generateImageHash(uploadedImagePath);
    
    // We can delete the temporary uploaded file since we only needed its hash
    fs.unlink(uploadedImagePath, (err) => {
      if (err) console.error('Failed to delete temporary search image:', err);
    });

    if (!targetHash) {
      return res.status(400).json({ error: 'Could not generate hash for uploaded image' });
    }

    const candidates = await prisma.item.findMany({
      where: { status: 'ACTIVE', imageHash: { not: null } }
    });

    const matches = candidates.map(cand => {
      const distance = hammingDistance(targetHash, cand.imageHash);
      const similarity = Math.max(0, 100 - (distance / 64) * 100);
      return { item: cand, similarity };
    });

    // Sort descending and return top 5 matches
    matches.sort((a, b) => b.similarity - a.similarity);
    res.json(matches.slice(0, 5));
  } catch (error) {
    console.error('Image search failed:', error);
    res.status(500).json({ error: 'Image search failed' });
  }
});

// FEATURE 4: Automated Image Matching
app.post('/api/items/:id/find-matches', async (req, res) => {
  const { id } = req.params;
  try {
    const targetItem = await prisma.item.findUnique({ where: { id } });
    if (!targetItem || !targetItem.imageHash) {
      return res.status(400).json({ error: 'Item not found or has no image hash.' });
    }

    const oppositeType = targetItem.type === 'LOST' ? 'FOUND' : 'LOST';
    const candidates = await prisma.item.findMany({
      where: { type: oppositeType, status: 'ACTIVE', imageHash: { not: null } }
    });

    const matches = candidates.map(cand => {
      const distance = hammingDistance(targetItem.imageHash, cand.imageHash);
      // Convert distance to similarity percentage (64 bit hash)
      const similarity = Math.max(0, 100 - (distance / 64) * 100);
      return { item: cand, similarity };
    });

    // Sort descending and return top 3
    matches.sort((a, b) => b.similarity - a.similarity);
    res.json(matches.slice(0, 3));
  } catch (error) {
    res.status(500).json({ error: 'Match finding failed' });
  }
});

// FEATURE 8: Claim Verification Workflows
app.post('/api/items/:id/verify-claim', async (req, res) => {
  const { id } = req.params;
  const { descriptorGuess } = req.body;

  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (!item.hiddenDescriptor) return res.status(400).json({ error: 'No hidden verification needed for this item. Use direct claim.' });

    // Simple validation
    if (item.hiddenDescriptor.toLowerCase().includes(descriptorGuess.toLowerCase())) {
      await prisma.item.update({
        where: { id },
        data: { status: 'PENDING_DELIVERY' }
      });
      return res.json({ success: true, message: 'Verification passed. Item status updated to pending delivery.' });
    } else {
      return res.status(400).json({ success: false, error: 'Verification failed. Descriptor mismatch.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification error' });
  }
});

// Claim item (direct)
app.delete('/api/items/:id/claim', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.item.update({
      where: { id },
      data: { claimed: true, status: 'ARCHIVED' }
    });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to claim item' });
  }
});

// FEATURE 10: Dynamic PDF & QR Code Flyer Generator
app.get('/api/items/:id/flyer', async (req, res) => {
  const { id } = req.params;
const baseUrl = req.query.baseUrl || 'https://campus-lost-and-found-amber.vercel.app';
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const profile = item.userId ? userProfiles.get(item.userId) : null;
    const itemUrl = `${baseUrl}/items/${id}`; // Dynamically construct URL from request
    const qrDataUrl = await QRCode.toDataURL(itemUrl);

    // Create PDF
    const doc = new PDFDocument({ size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="flyer-${id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(30).text(`${item.type}: ${item.name}`, { align: 'center' });
    doc.moveDown();

    if (item.imageUrl) {
      const imgPath = path.join(__dirname, item.imageUrl);
      if (fs.existsSync(imgPath)) {
        doc.image(imgPath, { fit: [400, 300], align: 'center' });
        doc.moveDown(15);
      }
    }

    doc.fontSize(16).text(`Description: ${item.description}`);
    doc.text(`Location: ${item.location}`);
    doc.text(`Date: ${item.date.toDateString()}`);
    doc.moveDown();

    if (profile) {
      doc.text(`Contact Email: ${profile.email}`);
      doc.text(`WhatsApp: ${profile.whatsapp}`);
    }

    doc.moveDown();
    // Add QR Code (QRCode.toDataURL returns a base64 png string)
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, 'base64');
    doc.image(imgBuffer, { fit: [150, 150], align: 'center' });

    doc.end();

  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'Failed to generate flyer' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
