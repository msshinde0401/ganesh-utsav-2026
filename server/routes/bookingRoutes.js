import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();
const MAX_SLOT_CAPACITY = 2;

// 1. Get real-time slot counts
router.get('/slots', async (req, res) => {
  try {
    const flatsSnapshot = await db.collection('flats').get();
    const slotCounts = {};
    
    flatsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.hasBooked) {
        const slotId = data.bookedSlotId || data.slotId;
        if (slotId) {
          slotCounts[slotId] = (slotCounts[slotId] || 0) + 1;
        }
      }
    });

    res.json({ success: true, slotCounts, maxCapacityPerSession: MAX_SLOT_CAPACITY });
  } catch (err) {
    console.error('Error fetching slots:', err);
    res.status(500).json({ success: false, error: err.message, slotCounts: {} });
  }
});

// 2. Fetch grouped Admin schedule
router.get('/admin/bookings', async (req, res) => {
  try {
    const flatsSnapshot = await db.collection('flats').get();
    const bookingsByDate = {};

    flatsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.hasBooked) {
        const slotId = data.bookedSlotId || data.slotId;
        if (slotId) {
          const isMorning = slotId.endsWith('-morning');
          const rawDate = slotId.replace(/-(morning|evening)$/i, '');

          if (!bookingsByDate[rawDate]) {
            bookingsByDate[rawDate] = { morning: [], evening: [] };
          }

          const flatLabel = data.wing && data.flatNumber 
            ? `${data.wing}-${data.flatNumber}`
            : doc.id;

          if (isMorning) {
            bookingsByDate[rawDate].morning.push(flatLabel);
          } else {
            bookingsByDate[rawDate].evening.push(flatLabel);
          }
        }
      }
    });

    res.json({ success: true, schedule: bookingsByDate });
  } catch (err) {
    console.error('Error fetching admin bookings:', err);
    res.status(500).json({ success: false, error: err.message, schedule: {} });
  }
});

// 3. Check flat status
router.get('/flat-status/:flatId', async (req, res) => {
  try {
    const { flatId } = req.params;
    const flatRef = db.collection('flats').doc(flatId.toUpperCase());
    const doc = await flatRef.get();

    if (!doc.exists) {
      return res.json({ success: true, hasBooked: false });
    }

    res.json({ success: true, ...doc.data() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Booking transaction
router.post('/book', async (req, res) => {
  try {
    const { wing, flatNumber, slotId } = req.body;

    if (!wing || !flatNumber || !slotId) {
      return res.status(400).json({ success: false, error: 'Wing, Flat Number, and Slot ID are required.' });
    }

    if (slotId === '2026-09-14-morning') {
      return res.status(400).json({ success: false, error: 'Morning Aarti slot is not available on 14th September.' });
    }

    const flatId = `${wing.toUpperCase()}-${flatNumber.trim()}`;
    const flatRef = db.collection('flats').doc(flatId);
    const bookingId = `BK-${flatId}-${slotId.toUpperCase()}`;
    const rawDate = slotId.replace(/-(morning|evening)$/i, '');

    await db.runTransaction(async (transaction) => {
      const flatDoc = await transaction.get(flatRef);
      if (flatDoc.exists && flatDoc.data().hasBooked) {
        throw new Error(`Flat ${flatId} has already booked a slot. Only 1 booking per flat allowed.`);
      }

      const existingSnapshot = await db.collection('flats').where('hasBooked', '==', true).get();
      let currentSlotCount = 0;
      existingSnapshot.forEach((doc) => {
        const d = doc.data();
        if ((d.bookedSlotId || d.slotId) === slotId) currentSlotCount++;
      });

      if (currentSlotCount >= MAX_SLOT_CAPACITY) {
        throw new Error('This slot is fully booked (Maximum 2 flats allowed).');
      }

      transaction.set(flatRef, {
        flatId,
        wing: wing.toUpperCase(),
        flatNumber: flatNumber.trim(),
        hasBooked: true,
        bookingId,
        bookedSlotId: slotId,
        slotId,
        bookedDate: rawDate,
        date: rawDate,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });

    return res.status(200).json({ success: true, message: 'Booked successfully!', bookingId, flatId, slotId });
  } catch (err) {
    console.error('Booking Error:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Reset endpoint
router.post('/reset', async (req, res) => {
  try {
    const flatsSnapshot = await db.collection('flats').get();
    if (flatsSnapshot.empty) {
      return res.json({ success: true, message: 'Already empty.' });
    }

    const batch = db.batch();
    flatsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return res.json({ success: true, message: 'Successfully reset!' });
  } catch (err) {
    console.error('Reset Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;