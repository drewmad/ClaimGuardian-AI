'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Session } from '@prisma/client';
import { getUserActiveSessions, deleteSession } from '@/lib/session-management';

interface SessionsListProps {
  userId: string;
}

export default function SessionsList({ userId }: SessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Fetch sessions when component mounts
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const activeSessions = await getUserActiveSessions(userId);
        setSessions(activeSessions);
        
        // Determine current session
        const res = await fetch('/api/auth/session/current');
        if (res.ok) {
          const data = await res.json();
          setCurrentSessionId(data.sessionId);
        }
      } catch (err) {
        setError('Failed to load active sessions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [userId]);

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await fetch('/api/auth/session/terminate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      // Remove session from UI
      setSessions((prevSessions) => 
        prevSessions.filter((session) => session.id !== sessionId)
      );
    } catch (err) {
      setError('Failed to terminate session');
      console.error(err);
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    try {
      await fetch('/api/auth/session/terminate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Keep only the current session in UI
      setSessions((prevSessions) => 
        prevSessions.filter((session) => session.id === currentSessionId)
      );
    } catch (err) {
      setError('Failed to terminate other sessions');
      console.error(err);
    }
  };

  const formatDeviceInfo = (session: Session) => {
    if (!session.deviceInfo) return 'Unknown device';
    
    try {
      const deviceInfo = JSON.parse(session.deviceInfo);
      return `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.device})`;
    } catch (err) {
      return 'Unknown device';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No active sessions found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Active Sessions</h3>
        {sessions.length > 1 && (
          <button
            onClick={handleTerminateAllOtherSessions}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Sign out all other sessions
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`border rounded-lg p-4 ${
              session.id === currentSessionId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {formatDeviceInfo(session)}
                  {session.id === currentSessionId && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">
                      Current Session
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <div>
                    IP: {session.ipAddress || 'Unknown'}
                  </div>
                  <div>
                    Last active: {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}
                  </div>
                  <div>
                    Expires: {formatDistanceToNow(new Date(session.expires), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              {session.id !== currentSessionId && (
                <button
                  onClick={() => handleTerminateSession(session.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 