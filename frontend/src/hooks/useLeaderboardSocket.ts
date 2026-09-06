import { useState, useEffect, useRef, useCallback } from 'react';

interface SolveEvent {
  event: string;
  username: string;
  scenario_title: string;
  points: number;
  timestamp: string;
}

export const useLeaderboardSocket = (competitionSlug?: string) => {
  const [latestSolve, setLatestSolve] = useState<SolveEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    let wsUrl: string;
    if (wsBase) {
      const cleanBase = wsBase.replace(/\/+$/, '');
      const path = competitionSlug ? `/leaderboard/${competitionSlug}/` : '/leaderboard/';
      wsUrl = `${cleanBase}${path}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const path = competitionSlug ? `/ws/leaderboard/${competitionSlug}/` : '/ws/leaderboard/';
      wsUrl = `${protocol}//${host}${path}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'SOLVE_RECORDED') {
            setLatestSolve(payload);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }
  }, [competitionSlug]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected, latestSolve };
};
