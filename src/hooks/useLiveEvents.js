import { useState, useEffect } from 'react';

/**
 * Custom hook to manage real-time Server-Sent Events (SSE) connections with mock fallback routines.
 * @param {number} maxHistory - Maximum elements retained in state to prevent memory bloat.
 * @returns {Array<Object>}
 */
const useLiveEvents = (maxHistory = 20) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let eventSource = null;
    let fallbackInterval = null;

    const gatewayUrl = import.meta.env.VITE_ADMIN_API_GATEWAY_URL || 'http://localhost:5000';
    const sseUrl = `${gatewayUrl}/api/v1/admin/live-activities`;

    console.log(`[useLiveEvents] Initializing EventSource link connection: ${sseUrl}`);

    const mockEventTypes = [
      { badge: 'NEW_USER', message: 'Customer registration: Sarah Jenkins created a new account.' },
      { badge: 'BOOKING_COMPLETE', message: 'Booking B-2051 completed by Marcus Vance. Amount: $45.00.' },
      { badge: 'SCRAP_PICKUP', message: 'Scrap collection: P-102 recovered 124 kg of copper wire.' },
      { badge: 'PARTNER_REGISTER', message: 'Partner application: Carlos Delgado signed up as Metal Specialist.' },
      { badge: 'PAYOUT_SENT', message: 'Fulfillment payout of $84.00 processed for Partner Elena Rostova.' },
      { badge: 'AUTH_ALERT', message: 'Administrative access token successfully refreshed for superadmin session.' },
    ];

    const startMockEventStream = () => {
      if (fallbackInterval) clearInterval(fallbackInterval);

      // Pre-seed some initial mock events to populate the UI timeline immediately
      const initialSeed = Array.from({ length: 4 }).map((_, index) => ({
        id: `mock-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
        badge: mockEventTypes[index % mockEventTypes.length].badge,
        message: mockEventTypes[index % mockEventTypes.length].message,
        timestamp: new Date(Date.now() - index * 60000),
      }));
      setEvents(initialSeed);

      // Programmatically trigger a new mock event every 8 seconds
      fallbackInterval = setInterval(() => {
        const randEvent = mockEventTypes[Math.floor(Math.random() * mockEventTypes.length)];
        const newEvent = {
          id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          badge: randEvent.badge,
          message: randEvent.message,
          timestamp: new Date(),
        };

        setEvents((prev) => [newEvent, ...prev].slice(0, maxHistory));
      }, 8000);
    };

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          const newEvent = {
            id: packet.id || Date.now() + Math.random().toString(36).substring(2, 9),
            badge: packet.badge || 'ACTIVITY',
            message: packet.message || '',
            timestamp: new Date(packet.timestamp || Date.now()),
          };

          setEvents((prev) => [newEvent, ...prev].slice(0, maxHistory));
        } catch (parseErr) {
          console.error('[useLiveEvents] Failed parsing raw SSE frame:', parseErr);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('[useLiveEvents] EventSource connection failed. Activating mock interval generator stream.', err);
        if (eventSource) {
          eventSource.close();
        }
        startMockEventStream();
      };
    } catch (initErr) {
      console.warn('[useLiveEvents] EventSource is not supported by browser. Falling back to mock generator.', initErr);
      startMockEventStream();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        console.log('[useLiveEvents] EventSource connection successfully closed.');
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        console.log('[useLiveEvents] Mock fallback stream interval destroyed.');
      }
    };
  }, [maxHistory]);

  return events;
};

export default useLiveEvents;
