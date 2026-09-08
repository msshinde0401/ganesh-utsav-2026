import express from 'express';
import cors from 'cors';
import { db } from './config/firebase.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Ganesh Utsav Aarti Backend is running successfully!');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Fetch all booking slots from Firestore
app.get('/api/slots', async (req, res) => {
  try {
    const snapshot = await db.collection('slots').get();
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book a slot with flat number validation (must end in 01-05)
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});