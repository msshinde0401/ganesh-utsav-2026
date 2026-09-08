import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Get overall stats and flat grid data for Wing A and B
router.get('/all-flats', async (req, res) => {
  try {
    const snapshot = await db.collection('flats').get();
    const flats = snapshot.docs.map((doc) => doc.data());

    const totalFlats = 120;
    const bookedCount = flats.filter((f) => f.hasBooked).length;
    const availableCount = totalFlats - bookedCount;

    res.json({
      success: true,
      stats: {
        totalFlats,
        bookedCount,
        availableCount,
      },
      flats,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;