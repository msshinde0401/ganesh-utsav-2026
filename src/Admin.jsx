import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const FLAT_NUMBERS = [];
for (let floor = 1; floor <= 12; floor++) {
  for (let flat = 1; flat <= 5; flat++) {
    FLAT_NUMBERS.push(`${floor}${flat.toString().padStart(2, '0')}`);
  }
}

export default function Admin() {
  const [activeWing, setActiveWing] = useState('A');
  const [flatsData, setFlatsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllFlats();
  }, []);

  const fetchAllFlats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/all-flats`);
      const data = await res.json();
      if (data.success) {
        const flatMap = {};
        data.flats.forEach((f) => {
          flatMap[f.flatId] = f;
        });
        setFlatsData(flatMap);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const bookedCountA = FLAT_NUMBERS.filter((f) => flatsData[`A-${f}`]?.hasBooked).length;
  const bookedCountB = FLAT_NUMBERS.filter((f) => flatsData[`B-${f}`]?.hasBooked).length;

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '20px auto', padding: '16px' }}>
      <header style={{ background: '#263238', color: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Ganesh Utsav 2026 — Admin Portal</h1>
        <p style={{ margin: '4px 0 0', opacity: 0.9 }}>120 Flats Society Booking Tracker</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '20px 0' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}>
          <h3>Wing A Bookings</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2', margin: '8px 0 0' }}>{bookedCountA} / 60</p>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}>
          <h3>Wing B Bookings</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c', margin: '8px 0 0' }}>{bookedCountB} / 60</p>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' }}>
          <h3>Total Booked</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f', margin: '8px 0 0' }}>{bookedCountA + bookedCountB} / 120</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveWing('A')} 
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeWing === 'A' ? '3px solid #d32f2f' : 'none', fontWeight: activeWing === 'A' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          Wing A (60 Flats)
        </button>
        <button 
          onClick={() => setActiveWing('B')} 
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeWing === 'B' ? '3px solid #d32f2f' : 'none', fontWeight: activeWing === 'B' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          Wing B (60 Flats)
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading flat status...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {FLAT_NUMBERS.map((num) => {
            const flatId = `${activeWing}-${num}`;
            const isBooked = flatsData[flatId]?.hasBooked;

            return (
              <div 
                key={flatId} 
                style={{
                  border: '1px solid',
                  borderRadius: '8px',
                  padding: '14px 8px',
                  textAlign: 'center',
                  backgroundColor: isBooked ? '#e8f5e9' : '#fafafa',
                  borderColor: isBooked ? '#81c784' : '#e0e0e0',
                  color: isBooked ? '#2e7d32' : '#757575'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{num}</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>{isBooked ? 'Booked' : 'Open'}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}