import { useEffect, useRef } from 'react';

/**
 * Hook to listen for tournament state changes (e.g. Pause, Resume, Reset, Duration Change)
 * from the backend over WebSockets. Triggers a callback when an update occurs.
 */
export const useTournamentSync = (onUpdate: () => void) => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let isMounted = true;
    
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // Connect to the global leaderboard room which broadcasts tournament updates
      const wsUrl = `${protocol}//${host}/ws/leaderboard/`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.event === 'TOURNAMENT_STATE_CHANGED') {
              onUpdate();
            }
          } catch (e) {
            console.error('Error parsing tournament sync socket message', e);
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            // Reconnect after a short delay if disconnected
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [onUpdate]);
};
