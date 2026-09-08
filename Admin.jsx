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
  const [selectedFlat, setSelectedFlat] = useState(null);

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
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>Ganesh Utsav 2026 — Admin Portal</h1>
        <p style={{ margin: '4px 0 0', opacity: 0.9 }}>120 Flats Society Booking Tracker</p>
      </header>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <h3>Wing A Bookings</h3>
          <p style={{ ...styles.statNumber, color: '#1976d2' }}>{bookedCountA} / 60</p>
        </div>
        <div style={styles.statCard}>
          <h3>Wing B Bookings</h3>
          <p style={{ ...styles.statNumber, color: '#388e3c' }}>{bookedCountB} / 60</p>
        </div>
        <div style={styles.statCard}>
          <h3>Total Booked</h3>
          <p style={{ ...styles.statNumber, color: '#d32f2f' }}>{bookedCountA + bookedCountB} / 120</p>
        </div>
      </div>

      <div style={styles.tabContainer}>
        <button 
          onClick={() => setActiveWing('A')} 
          style={{ ...styles.tab, borderBottom: activeWing === 'A' ? '3px solid #d32f2f' : 'none', fontWeight: activeWing === 'A' ? 'bold' : 'normal' }}
        >
          Wing A (60 Flats)
        </button>
        <button 
          onClick={() => setActiveWing('B')} 
          style={{ ...styles.tab, borderBottom: activeWing === 'B' ? '3px solid #d32f2f' : 'none', fontWeight: activeWing === 'B' ? 'bold' : 'normal' }}
        >
          Wing B (60 Flats)
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading flat status...</p>
      ) : (
        <div style={styles.grid}>
          {FLAT_NUMBERS.map((num) => {
            const flatId = `${activeWing}-${num}`;
            const flatInfo = flatsData[flatId];
            const isBooked = flatInfo?.hasBooked;

            return (
              <div 
                key={flatId} 
                onClick={() => setSelectedFlat(flatInfo || { flatId, hasBooked: false })}
                style={{
                  ...styles.flatCard,
                  backgroundColor: isBooked ? '#e8f5e9' : '#fafafa',
                  borderColor: isBooked ? '#81c784' : '#e0e0e0',
                  color: isBooked ? '#2e7d32' : '#757575'
                }}
              >
                <div style={styles.flatNumber}>{num}</div>
                <div style={styles.flatBadge}>{isBooked ? 'Booked' : 'Open'}</div>
              </div>
            );
          })}
        </div>
      )}

      {selectedFlat && (
        <div style={styles.modalOverlay} onClick={() => setSelectedFlat(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Flat {selectedFlat.flatId} Details</h3>
            {selectedFlat.hasBooked ? (
              <div>
                <p><strong>Booking ID:</strong> {selectedFlat.bookingId}</p>
                <p><strong>Date:</strong> {selectedFlat.eventDate}</p>
                <p><strong>Session:</strong> {selectedFlat.session} Aarti</p>
              </div>
            ) : (
              <p style={{ color: '#666' }}>No Aarti slot booked yet for this flat.</p>
            )}
            <button onClick={() => setSelectedFlat(null)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: 'Segoe UI, Roboto, sans-serif', maxWidth: '900px', margin: '20px auto', padding: '16px' },
  header: { background: '#263238', color: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '20px 0' },
  statCard: { background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #eee', textAlign: 'center' },
  statNumber: { fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0' },
  tabContainer: { display: 'flex', gap: '16px', borderBottom: '1px solid #ddd', marginBottom: '20px' },
  tab: { padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' },
  flatCard: { border: '1px solid', borderRadius: '8px', padding: '14px 8px', textAlign: 'center', cursor: 'pointer' },
  flatNumber: { fontSize: '16px', fontWeight: 'bold' },
  flatBadge: { fontSize: '11px', marginTop: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', padding: '24px', borderRadius: '8px', width: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
  closeBtn: { width: '100%', padding: '10px', marginTop: '16px', background: '#37474f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};