import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';
const CAPACITY_PER_SESSION = 2;

const FESTIVAL_DAYS = [
  { day: 1, date: '2026-09-14', title: 'Day 1 — Sep 14', event: 'Ganesh Chaturthi' },
  { day: 2, date: '2026-09-15', title: 'Day 2 — Sep 15', event: '' },
  { day: 3, date: '2026-09-16', title: 'Day 3 — Sep 16', event: '' },
  { day: 4, date: '2026-09-17', title: 'Day 4 — Sep 17', event: '' },
  { day: 5, date: '2026-09-18', title: 'Day 5 — Sep 18', event: 'Rishi Panchami' },
  { day: 6, date: '2026-09-19', title: 'Day 6 — Sep 19', event: '' },
  { day: 7, date: '2026-09-20', title: 'Day 7 — Sep 20', event: '' },
  { day: 8, date: '2026-09-21', title: 'Day 8 — Sep 21', event: '' },
  { day: 9, date: '2026-09-22', title: 'Day 9 — Sep 22', event: '' },
  { day: 10, date: '2026-09-23', title: 'Day 10 — Sep 23', event: 'Anant Chaturdashi' },
];

export default function App() {
  const [view, setView] = useState('user'); // 'user' | 'admin'

  const [wing, setWing] = useState('A');
  const [flatNumber, setFlatNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-14');
  const [selectedSession, setSelectedSession] = useState('evening');

  const [slotCounts, setSlotCounts] = useState({});
  const [flatAlreadyBooked, setFlatAlreadyBooked] = useState(false);
  const [existingBookingInfo, setExistingBookingInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const [adminSchedule, setAdminSchedule] = useState({});
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const fetchSlotAvailability = async () => {
    try {
      const res = await fetch(`${API_BASE}/slots`);
      const data = await res.json();
      if (data.success && data.slotCounts) {
        setSlotCounts(data.slotCounts);
      } else {
        setSlotCounts({});
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setSlotCounts({});
    }
  };

  const fetchAdminSchedule = async () => {
    setIsAdminLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/bookings`);
      const data = await res.json();
      if (data.success && data.schedule) {
        setAdminSchedule(data.schedule);
      } else {
        setAdminSchedule({});
      }
    } catch (err) {
      console.error('Error fetching admin schedule:', err);
      setAdminSchedule({});
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotAvailability();
  }, []);

  useEffect(() => {
    if (view === 'admin') {
      fetchAdminSchedule();
    }
  }, [view]);

  useEffect(() => {
    if (selectedDate === '2026-09-14' && selectedSession === 'morning') {
      setSelectedSession('evening');
    }
  }, [selectedDate]);

  // Validate that flat numbers end in 01 through 05 (e.g. 101-105, 201-205, etc.)
  const isValidFlatNumber = (flatNumStr) => {
    const trimmed = flatNumStr.trim();
    if (!/^\d{3,}$/.test(trimmed)) return false;
    const lastTwoDigits = parseInt(trimmed.slice(-2), 10);
    return lastTwoDigits >= 1 && lastTwoDigits <= 5;
  };

  const checkFlatStatus = async (flatNum) => {
    if (!flatNum || !flatNum.trim() || !isValidFlatNumber(flatNum)) {
      setFlatAlreadyBooked(false);
      setExistingBookingInfo('');
      return;
    }

    const flatId = `${wing}-${flatNum.trim()}`;
    try {
      const res = await fetch(`${API_BASE}/flat-status/${flatId}`);
      const data = await res.json();

      if (data.success && data.hasBooked) {
        setFlatAlreadyBooked(true);
        const bookedOn = data.bookedDate || data.date;
        setExistingBookingInfo(bookedOn ? `Booked for ${bookedOn}` : 'Already Booked');
      } else {
        setFlatAlreadyBooked(false);
        setExistingBookingInfo('');
      }
    } catch (err) {
      console.error('Error checking flat status:', err);
    }
  };

  const handleFlatChange = (e) => {
    const val = e.target.value;
    setFlatNumber(val);
    setBookingSuccess(null);
    checkFlatStatus(val);
  };

  const handleWingChange = (w) => {
    setWing(w);
    setBookingSuccess(null);
    if (flatNumber) checkFlatStatus(flatNumber);
  };

  const getSessionRemaining = (dateStr, sessionType) => {
    if (dateStr === '2026-09-14' && sessionType === 'morning') return 0;
    const slotKey = `${dateStr}-${sessionType}`;
    const booked = slotCounts[slotKey] || 0;
    return Math.max(0, CAPACITY_PER_SESSION - booked);
  };

  const morningRemaining = getSessionRemaining(selectedDate, 'morning');
  const eveningRemaining = getSessionRemaining(selectedDate, 'evening');
  const currentSelectedRemaining = selectedSession === 'morning' ? morningRemaining : eveningRemaining;

  const getDisabledReason = () => {
    if (!flatNumber.trim()) return 'Please enter a valid Flat Number.';
    if (!isValidFlatNumber(flatNumber)) {
      return 'Invalid flat number! Each floor only has flats from 01 to 05 (e.g., 101, 102, 103, 104, 105).';
    }
    if (flatAlreadyBooked) return `Flat ${wing}-${flatNumber} has already booked a slot (${existingBookingInfo}).`;
    if (selectedDate === '2026-09-14' && selectedSession === 'morning') return '14th September Morning Aarti is not available.';
    if (currentSelectedRemaining <= 0) return `The ${selectedSession} session on ${selectedDate} is fully booked.`;
    if (isSubmitting) return 'Processing your booking...';
    return null;
  };

  const disabledReason = getDisabledReason();
  const isBookingDisabled = Boolean(disabledReason);

  const handleConfirmBooking = async () => {
    if (isBookingDisabled) return;

    setIsSubmitting(true);
    setBookingSuccess(null);
    const slotId = `${selectedDate}-${selectedSession}`;

    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wing, flatNumber: flatNumber.trim(), slotId }),
      });

      const data = await res.json();
      if (data.success) {
        setBookingSuccess({
          bookingId: data.bookingId,
          flatId: `${wing}-${flatNumber.trim()}`,
          date: selectedDate,
          session: selectedSession,
        });
        setFlatAlreadyBooked(true);
        setExistingBookingInfo(`Booked for ${selectedDate}`);
        await fetchSlotAvailability();
      } else {
        alert(`Booking Failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Network error during booking:', err);
      alert('Failed to connect to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetData = async () => {
    const confirmReset = window.confirm('⚠️ ARE YOU SURE?\n\nThis will permanently delete all bookings and reset slots.');
    if (!confirmReset) return;

    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        alert('✅ Reset Successful!');
        setSlotCounts({});
        setAdminSchedule({});
        setFlatAlreadyBooked(false);
        setExistingBookingInfo('');
        setBookingSuccess(null);
        setFlatNumber('');
        await fetchSlotAvailability();
        await fetchAdminSchedule();
      } else {
        alert(`Reset Failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Reset error:', err);
      alert('Network error while resetting database.');
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', maxWidth: '850px', margin: '20px auto', padding: '20px' }}>
      {/* SINGLE CLEAN HEADER */}
      <header style={{ background: '#d32f2f', color: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '26px' }}>🌺 Ganesh Utsav 2026 — Aarti Portal</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.9 }}>(1 Booking Per Flat Limit across 10 Days)</p>

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => setView('user')}
            style={{
              padding: '8px 18px',
              marginRight: '10px',
              borderRadius: '4px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: view === 'user' ? '#ffffff' : '#ffcdd2',
              color: view === 'user' ? '#d32f2f' : '#333',
            }}
          >
            Booking Form
          </button>
          <button
            onClick={() => setView('admin')}
            style={{
              padding: '8px 18px',
              borderRadius: '4px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: view === 'admin' ? '#ffffff' : '#ffcdd2',
              color: view === 'admin' ? '#d32f2f' : '#333',
            }}
          >
            Admin Dashboard
          </button>
        </div>
      </header>

      {view === 'user' ? (
        <>
          <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>
              Step 1: Resident Details
            </h2>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Wing</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['A', 'B'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleWingChange(w)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: wing === w ? '#1976d2' : '#f5f5f5',
                        color: wing === w ? '#fff' : '#333',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Wing {w}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Flat Number (01–05 per floor)</label>
                <input
                  type="text"
                  placeholder="e.g. 101, 205, 303"
                  value={flatNumber}
                  onChange={handleFlatChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {flatAlreadyBooked && (
              <div style={{ marginTop: '12px', background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', border: '1px solid #ffcdd2' }}>
                ⚠️ <strong>Booking Limit:</strong> Flat <strong>{wing}-{flatNumber}</strong> has already booked a slot ({existingBookingInfo}).
              </div>
            )}
          </section>

          <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>
              Step 2: Select Date
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '10px', marginTop: '16px' }}>
              {FESTIVAL_DAYS.map((d) => {
                const mRem = getSessionRemaining(d.date, 'morning');
                const eRem = getSessionRemaining(d.date, 'evening');
                const maxDaily = d.date === '2026-09-14' ? 2 : 4;
                const dayTotalRem = mRem + eRem;
                const isSelected = selectedDate === d.date;

                return (
                  <div
                    key={d.date}
                    onClick={() => {
                      setSelectedDate(d.date);
                      setBookingSuccess(null);
                    }}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2e7d32' : '1px solid #ddd',
                      backgroundColor: isSelected ? '#e8f5e9' : '#fafafa',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: isSelected ? '#2e7d32' : '#333' }}>
                      {d.title}
                    </div>
                    {d.event && <div style={{ fontSize: '10px', color: '#d32f2f', fontWeight: 'bold' }}>{d.event}</div>}

                    <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 'bold', color: dayTotalRem > 0 ? '#1b5e20' : '#b71c1c' }}>
                      {dayTotalRem > 0 ? `🟢 ${dayTotalRem} / ${maxDaily} Left` : '🔴 Full'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '20px', background: '#f9f9f9', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px' }}>Choose Session for {selectedDate}:</h3>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSession('morning')}
                  disabled={selectedDate === '2026-09-14' || morningRemaining === 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: selectedDate === '2026-09-14' || morningRemaining === 0 ? '#eee' : selectedSession === 'morning' ? '#e8f5e9' : '#fff',
                    color: selectedDate === '2026-09-14' || morningRemaining === 0 ? '#999' : selectedSession === 'morning' ? '#2e7d32' : '#333',
                    fontWeight: selectedSession === 'morning' ? 'bold' : 'normal',
                    cursor: selectedDate === '2026-09-14' || morningRemaining === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  🌅 Morning Aarti (8:00 AM)
                  <br />
                  <small style={{ fontWeight: 'normal' }}>
                    {selectedDate === '2026-09-14' ? '🚫 N/A on 14th Sep' : `Remaining: ${morningRemaining} / 2`}
                  </small>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSession('evening')}
                  disabled={eveningRemaining === 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    backgroundColor: eveningRemaining === 0 ? '#eee' : selectedSession === 'evening' ? '#e8f5e9' : '#fff',
                    color: eveningRemaining === 0 ? '#999' : selectedSession === 'evening' ? '#2e7d32' : '#333',
                    fontWeight: selectedSession === 'evening' ? 'bold' : 'normal',
                    cursor: eveningRemaining === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  🪔 Evening Aarti (7:30 PM)
                  <br />
                  <small style={{ fontWeight: 'normal' }}>Remaining: {eveningRemaining} / 2</small>
                </button>
              </div>
            </div>
          </section>

          <section style={{ marginTop: '20px' }}>
            {disabledReason && (
              <p style={{ color: '#d32f2f', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                ⚠️ {disabledReason}
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={isBookingDisabled}
              style={{
                padding: '16px',
                backgroundColor: isBookingDisabled ? '#b0bec5' : '#2e7d32',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: isBookingDisabled ? 'not-allowed' : 'pointer',
                width: '100%',
              }}
            >
              {isSubmitting ? 'Processing...' : `Confirm Booking (${selectedDate} - ${selectedSession.toUpperCase()})`}
            </button>

            {bookingSuccess && (
              <div style={{ marginTop: '16px', background: '#e8f5e9', color: '#1b5e20', padding: '16px', borderRadius: '6px', border: '1px solid #a5d6a7', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px' }}>🎉 Aarti Slot Booked Successfully!</h3>
                <p style={{ margin: '4px 0' }}><strong>Flat:</strong> {bookingSuccess.flatId}</p>
                <p style={{ margin: '4px 0' }}><strong>Date:</strong> {bookingSuccess.date} ({bookingSuccess.session.toUpperCase()})</p>
                <p style={{ margin: '4px 0' }}><strong>Reference ID:</strong> {bookingSuccess.bookingId}</p>
              </div>
            )}
          </section>
        </>
      ) : (
        /* ADMIN DASHBOARD VIEW */
        <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>📋 Aarti Schedule Table</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={fetchAdminSchedule}
                style={{ padding: '8px 14px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleResetData}
                style={{ padding: '8px 14px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🗑️ Reset All Bookings
              </button>
            </div>
          </div>

          {isAdminLoading ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading schedule...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', width: '25%' }}>Date</th>
                    <th style={{ padding: '12px', width: '37.5%' }}>🌅 Morning Aarti Slot (Max 2)</th>
                    <th style={{ padding: '12px', width: '37.5%' }}>🪔 Evening Aarti Slot (Max 2)</th>
                  </tr>
                </thead>
                <tbody>
                  {FESTIVAL_DAYS.map((d) => {
                    const dayData = adminSchedule[d.date] || { morning: [], evening: [] };
                    const isSep14 = d.date === '2026-09-14';

                    return (
                      <tr key={d.date} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>
                          {d.title}
                          {d.event && <div style={{ fontSize: '11px', color: '#d32f2f' }}>{d.event}</div>}
                        </td>

                        <td style={{ padding: '12px', backgroundColor: isSep14 ? '#f5f5f5' : 'transparent' }}>
                          {isSep14 ? (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>🚫 Not Available</span>
                          ) : dayData.morning && dayData.morning.length > 0 ? (
                            dayData.morning.map((flat) => (
                              <span key={flat} style={{ display: 'inline-block', background: '#e3f2fd', color: '#0d47a1', padding: '6px 10px', borderRadius: '4px', marginRight: '6px', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                                🏠 Flat {flat}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#999', fontSize: '13px' }}>No Bookings</span>
                          )}
                        </td>

                        <td style={{ padding: '12px' }}>
                          {dayData.evening && dayData.evening.length > 0 ? (
                            dayData.evening.map((flat) => (
                              <span key={flat} style={{ display: 'inline-block', background: '#fff3e0', color: '#e65100', padding: '6px 10px', borderRadius: '4px', marginRight: '6px', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                                🏠 Flat {flat}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#999', fontSize: '13px' }}>No Bookings</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}