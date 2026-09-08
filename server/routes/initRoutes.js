import { Router } from 'express';
import { db } from '../firebaseAdmin.js';

const router = Router();

router.post('/initialize-system', async (req, res) => {
  try {
    const batch = db.batch();

    // 1. Initialize Event Config
    const configRef = db.collection('eventConfig').doc('2026_config');
    batch.set(configRef, {
      eventName: 'Ganesh Utsav 2026',
      eventYear: 2026,
      startDate: '2026-09-14',
      endDate: '2026-09-25',
      bookingOpen: true,
      maxCapacityPerSlot: 2,
      totalSlotsCount: 23,
      totalCapacity: 46,
      active: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Initialize 120 Flats
    const wings = ['A', 'B'];
    let flatCount = 0;

    for (const wing of wings) {
      for (let floor = 1; floor <= 12; floor++) {
        for (let unit = 1; unit <= 5; unit++) {
          const flatNumber = `${floor}${unit < 10 ? '0' : ''}${unit}`;
          const flatId = `${wing}-${flatNumber}`;
          const flatRef = db.collection('flats').doc(flatId);

          batch.set(flatRef, {
            flatId,
            wing,
            flatNumber,
            floor,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });

          flatCount++;
        }
      }
    }

    // 3. Initialize 23 Aarti Slots
    const dates = [
      '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17',
      '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21',
      '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'
    ];

    let slotCount = 0;

    for (const date of dates) {
      const sessions = date === '2026-09-14' ? ['EVENING'] : ['MORNING', 'EVENING'];

      for (const session of sessions) {
        const slotId = `SLOT_${date}_${session}`;
        const slotRef = db.collection('aartiSlots').doc(slotId);

        const docSnap = await slotRef.get();
        const existingData = docSnap.exists ? docSnap.data() : {};

        batch.set(slotRef, {
          slotId,
          eventDate: date,
          session,
          capacity: 2,
          bookedCount: existingData.bookedCount || 0,
          active: true,
          createdAt: existingData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        slotCount++;
      }
    }

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: 'System initialization successful!',
      details: { flatsCreated: flatCount, slotsCreated: slotCount, totalCapacity: 46 }
    });
  } catch (error) {
    console.error('Initialization error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;