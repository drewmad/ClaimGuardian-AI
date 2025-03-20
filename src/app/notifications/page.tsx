'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string | Date;
}

interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  unreadCount: number;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notificationData, setNotificationData] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/notifications?page=${currentPage}&pageSize=10`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotificationData(data);
      } catch (err) {
        setError('Failed to load notifications');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [status, currentPage]);
  
  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });
      
      if (response.ok && notificationData) {
        // Update local state
        setNotificationData({
          ...notificationData,
          notifications: notificationData.notifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          ),
          unreadCount: Math.max(0, notificationData.unreadCount - 1),
        });
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });
      
      if (response.ok && notificationData) {
        // Update local state
        setNotificationData({
          ...notificationData,
          notifications: notificationData.notifications.map(notification => ({
            ...notification,
            isRead: true,
          })),
          unreadCount: 0,
        });
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };
  
  // Format notification date
  const formatDate = (date: string | Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Change page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // If not authenticated, show login message
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Not Authenticated</h2>
          <p className="text-gray-600">Please log in to view your notifications.</p>
          <Link 
            href="/auth/login" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notificationData?.unreadCount ? (
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Mark all as read
          </button>
        ) : null}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-md">
          {error}
        </div>
      ) : notificationData?.notifications.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-md shadow">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold">No notifications</h2>
          <p className="text-gray-500 mt-1">You don't have any notifications yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {notificationData?.notifications.map((notification) => (
                <li 
                  key={notification.id}
                  className={`${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}
                >
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                      className="block p-6 hover:bg-gray-50"
                    >
                      <div className="flex items-start">
                        {/* Notification icon based on type */}
                        <div className="mr-4 mt-1">
                          <NotificationIcon type={notification.type} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="text-lg font-semibold">{notification.title}</h3>
                            <span className="text-sm text-gray-500">{formatDate(notification.createdAt)}</span>
                          </div>
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        
                        {!notification.isRead && (
                          <span className="h-3 w-3 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div 
                      className="block p-6 hover:bg-gray-50"
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex items-start">
                        {/* Notification icon based on type */}
                        <div className="mr-4 mt-1">
                          <NotificationIcon type={notification.type} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="text-lg font-semibold">{notification.title}</h3>
                            <span className="text-sm text-gray-500">{formatDate(notification.createdAt)}</span>
                          </div>
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        
                        {!notification.isRead && (
                          <span className="h-3 w-3 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Pagination */}
          {notificationData && notificationData.pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-md shadow" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: notificationData.pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === notificationData.pagination.totalPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    currentPage === notificationData.pagination.totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper component for notification icon
function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'CLAIM_STATUS_CHANGE':
      return (
        <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'POLICY_EXPIRY':
      return (
        <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'DOCUMENT_UPLOAD':
      return (
        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      );
    case 'PAYMENT_REMINDER':
      return (
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'SECURITY_ALERT':
      return (
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
} 