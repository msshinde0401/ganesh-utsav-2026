import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Slot {
  slotId: string;
  eventDate: string;
  session: 'MORNING' | 'EVENING';
  capacity: number;
  bookedCount: number;
}

interface ExistingBooking {
  bookingId: string;
  flatId: string;
  eventDate: string;
  session: string;
  status: string;
}

export const ResidentBooking: React.FC = () => {
  const [wing, setWing] = useState<'A' | 'B' | null>(null);
  const [selectedFlat, setSelectedFlat] = useState<string>('');
  const [existingBooking, setExistingBooking] = useState<ExistingBooking | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ExistingBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate 60 flat numbers per wing (Floors 1..12, Units 01..05)
  const flats = Array.from({ length: 12 }, (_, f) =>
    Array.from({ length: 5 }, (_, u) => `${f + 1}${u + 1 < 10 ? '0' : ''}${u + 1}`)
  ).flat();

  useEffect(() => {
    if (wing && selectedFlat) {
      checkFlatStatus(`${wing}-${selectedFlat}`);
    }
  }, [wing, selectedFlat]);

  const checkFlatStatus = async (flatId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/flat-status/${flatId}`);
      const data = await res.json();
      if (data.hasBooking) {
        setExistingBooking(data.booking);
      } else {
        setExistingBooking(null);
        fetchAvailableSlots();
      }
    } catch (err) {
      setError('Network error checking flat status.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const res = await fetch('/api/slots');
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      setError('Unable to fetch Aarti slots.');
    }
  };

  const handleBooking = async () => {
    if (!wing || !selectedFlat || !selectedSlot) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wing,
          flatNumber: selectedFlat,
          slotId: selectedSlot.slotId
        })
      });

      const data = await res.json();
      if (data.success) {
        setConfirmedBooking(data.booking);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (confirmedBooking) {
    return (
      <div className="max-w-md mx-auto my-6 p-6 bg-amber-50 rounded-2xl shadow-xl border-2 border-amber-400 text-center">
        <div className="text-4xl mb-2">🌸 🙏 🌸</div>
        <h2 className="text-2xl font-bold text-amber-900 mb-1">Aarti Booking Confirmed!</h2>
        <p className="text-sm text-amber-800 font-semibold mb-4">Ganesh Utsav 2026</p>

        <div className="bg-white p-4 rounded-xl border border-amber-200 mb-4 text-left space-y-2 text-lg">
          <div><span className="font-bold text-gray-600">Flat:</span> <span className="font-black text-amber-900">{confirmedBooking.flatId}</span></div>
          <div><span className="font-bold text-gray-600">Date:</span> <span className="font-bold text-gray-900">{confirmedBooking.eventDate}</span></div>
          <div><span className="font-bold text-gray-600">Session:</span> <span className="font-bold text-amber-800">{confirmedBooking.session}</span></div>
          <div><span className="font-bold text-gray-600">Booking ID:</span> <span className="font-mono text-xs font-bold bg-amber-100 p-1 rounded">{confirmedBooking.bookingId}</span></div>
        </div>

        <div className="flex justify-center p-4 bg-white rounded-xl border border-amber-200 mb-4">
          <QRCodeSVG value={confirmedBooking.bookingId} size={160} />
        </div>
        <p className="text-xs text-gray-500">Take a screenshot of this receipt for check-in.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white min-h-screen">
      <header className="text-center my-4">
        <h1 className="text-3xl font-extrabold text-amber-800">🌺 Ganesh Utsav 2026</h1>
        <p className="text-lg text-amber-900 font-medium mt-1">Aarti Booking Portal</p>
        <p className="text-xs text-gray-500 mt-1">14 September – 25 September 2026</p>
      </header>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded text-base font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* STEP 1: SELECT WING */}
      {!wing && (
        <div className="space-y-4 mt-6">
          <h2 className="text-xl font-bold text-center text-gray-800">Step 1: Select Your Wing</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setWing('A')}
              className="py-8 bg-amber-500 active:bg-amber-600 text-white font-black text-3xl rounded-2xl shadow-lg transform active:scale-95 transition"
            >
              A WING
            </button>
            <button
              onClick={() => setWing('B')}
              className="py-8 bg-orange-500 active:bg-orange-600 text-white font-black text-3xl rounded-2xl shadow-lg transform active:scale-95 transition"
            >
              B WING
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT FLAT */}
      {wing && !selectedFlat && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Wing {wing}: Select Flat</h2>
            <button onClick={() => setWing(null)} className="text-sm font-semibold text-amber-700 underline">Change Wing</button>
          </div>
          <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
            {flats.map((flatNum) => (
              <button
                key={flatNum}
                onClick={() => setSelectedFlat(flatNum)}
                className="py-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 font-bold text-xl rounded-xl text-amber-900 shadow-sm active:bg-amber-300"
              >
                {flatNum}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* IF FLAT ALREADY HAS BOOKING */}
      {existingBooking && (
        <div className="my-6 p-6 bg-red-50 border-2 border-red-300 rounded-2xl text-center">
          <div className="text-3xl mb-2">🛑</div>
          <h3 className="text-xl font-bold text-red-900">Already Booked!</h3>
          <p className="text-sm text-red-700 mt-1 mb-4">
            This flat has already booked a Ganesh Utsav Aarti slot. One flat can make only ONE booking.
          </p>
          <div className="bg-white p-4 rounded-xl text-left space-y-1 border border-red-200">
            <p><strong>Flat:</strong> {existingBooking.flatId}</p>
            <p><strong>Date:</strong> {existingBooking.eventDate}</p>
            <p><strong>Session:</strong> {existingBooking.session}</p>
            <p><strong>Booking ID:</strong> <span className="font-mono text-xs">{existingBooking.bookingId}</span></p>
            <p><strong>Status:</strong> <span className="text-green-600 font-bold">{existingBooking.status}</span></p>
          </div>
          <button
            onClick={() => { setSelectedFlat(''); setExistingBooking(null); }}
            className="mt-4 px-6 py-3 bg-gray-800 text-white font-bold rounded-xl"
          >
            Select Different Flat
          </button>
        </div>
      )}

      {/* STEP 3: SELECT AARTI SLOT */}
      {wing && selectedFlat && !existingBooking && !selectedSlot && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xs text-gray-500">Selected Flat:</span>
              <h2 className="text-2xl font-black text-amber-900">{wing}-{selectedFlat}</h2>
            </div>
            <button onClick={() => setSelectedFlat('')} className="text-sm font-semibold text-amber-700 underline">Change Flat</button>
          </div>

          <h3 className="text-lg font-bold mb-3 text-gray-800">Select Aarti Date & Slot</h3>
          
          {loading ? (
            <p className="text-center py-8 font-semibold text-amber-800">Loading slots...</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {slots.map((slot) => {
                const isFull = slot.bookedCount >= 2;
                return (
                  <button
                    key={slot.slotId}
                    disabled={isFull}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full p-4 rounded-xl border-2 text-left flex justify-between items-center transition ${
                      isFull
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-50 border-amber-300 hover:border-amber-500 text-amber-950 active:bg-amber-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-lg">{slot.eventDate}</div>
                      <div className="text-sm font-semibold text-amber-800">{slot.session} AARTI</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                        isFull ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                      }`}>
                        {slot.bookedCount}/2 {isFull ? 'FULL' : 'AVAILABLE'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: CONFIRMATION SCREEN */}
      {selectedSlot && (
        <div className="my-4 p-6 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-4">
          <h2 className="text-xl font-extrabold text-amber-900 text-center">Confirm Aarti Booking</h2>
          <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2 text-base">
            <p><strong>Flat:</strong> {wing}-{selectedFlat}</p>
            <p><strong>Date:</strong> {selectedSlot.eventDate}</p>
            <p><strong>Session:</strong> {selectedSlot.session}</p>
            <p><strong>Current Capacity:</strong> {selectedSlot.bookedCount}/2</p>
          </div>

          <button
            onClick={handleBooking}
            disabled={loading}
            className="w-full py-5 bg-green-600 active:bg-green-700 text-white font-black text-2xl rounded-xl shadow-lg"
          >
            {loading ? 'BOOKING...' : 'CONFIRM AARTI BOOKING'}
          </button>

          <button
            onClick={() => setSelectedSlot(null)}
            className="w-full py-2 text-gray-600 font-semibold text-sm"
          >
            Back to Slots Selection
          </button>
        </div>
      )}
    </div>
  );
};