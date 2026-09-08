import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './config/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/slots', async (req, res) => {
  try {
    const snapshot = await db.collection('slots').get();
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/book', async (req, res) => {
  try {
    const { slotId, flatNumber, name } = req.body;
    
    const validSuffixes = ['01', '02', '03', '04', '05'];
    const isValidFlat = validSuffixes.some(suffix => flatNumber.toString().trim().endsWith(suffix));
    
    if (!isValidFlat) {
      return res.status(400).json({ error: 'Invalid flat number. Must end in 01 to 05.' });
    }

    const slotRef = db.collection('slots').doc(slotId);
    const slotDoc = await slotRef.get();

    if (!slotDoc.exists) {
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (slotDoc.data().isBooked) {
      return res.status(400).json({ error: 'Slot is already booked.' });
    }

    await slotRef.update({
      isBooked: true,
      flatNumber,
      name,
      bookedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Slot booked successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});