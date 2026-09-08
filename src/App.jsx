import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = import.meta.env.PROD 
  ? 'https://elan-ganesh-utsav-2026.onrender.com/' 
  : 'http://localhost:5000/api';

function App() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [flatNumber, setFlatNumber] = useState('');
  const [name, setName] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/slots`);
      if (!response.ok) throw new Error('Failed to fetch booking slots');
      const data = await response.json();
      setSlots(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    try {
      const response = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          flatNumber: flatNumber.trim(),
          name: name.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Booking failed');

      setBookingMessage('Slot booked successfully!');
      setSelectedSlot(null);
      setFlatNumber('');
      setName('');
      fetchSlots();
    } catch (err) {
      setBookingMessage(err.message);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Ganesh Utsav Aarti Booking</h1>
        <p>Book your preferred aarti slot (Flat numbers must end in 01–05)</p>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {bookingMessage && <div className="info-banner">{bookingMessage}</div>}

      {loading ? (
        <p>Loading slots...</p>
      ) : (
        <div className="slots-grid">
          {slots.map((slot) => (
            <div key={slot.id} className={`slot-card ${slot.isBooked ? 'booked' : 'available'}`}>
              <h3>{slot.time || slot.title}</h3>
              <p>{slot.isBooked ? `Booked by Flat: ${slot.flatNumber}` : 'Available'}</p>
              {!slot.isBooked && (
                <button onClick={() => setSelectedSlot(slot)}>Book Slot</button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedSlot && (
        <div className="modal">
          <div className="modal-content">
            <h2>Book Slot: {selectedSlot.time || selectedSlot.title}</h2>
            <form onSubmit={handleBooking}>
              <div>
                <label>Name:</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label>Flat Number (must end in 01–05):</label>
                <input 
                  type="text" 
                  value={flatNumber} 
                  onChange={(e) => setFlatNumber(e.target.value)} 
                  placeholder="e.g., A-101" 
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="submit">Confirm Booking</button>
                <button type="button" onClick={() => setSelectedSlot(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;