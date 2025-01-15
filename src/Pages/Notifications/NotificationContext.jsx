import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SocketManager from './socket';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
            const token = localStorage.getItem('token');
            console.log('Fetching notifications with token:', token);
            const response = await axios.get(`${BASE_URL}/api/freelancer/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('NotificationContext: Fetched notifications:', response.data);
            if (Array.isArray(response.data)) {
                const sortedNotifications = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setNotifications(sortedNotifications);
                const unreadCount = sortedNotifications.filter(n => !n.is_read).length;
                setUnreadCount(unreadCount);
                console.log('Updated unread count:', unreadCount);
            } else {
                console.error('Unexpected response format:', response.data);
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error.response?.data || error.message);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
            const response = await axios.get(`${BASE_URL}/api/freelancer/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('NotificationContext: Fetched unread count:', response.data.count);
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('NotificationContext: Error fetching unread count:', error.response?.data || error.message);
        }
    }, []);

    useEffect(() => {
        const initializeNotifications = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            try {
                await SocketManager.connect(token);
                await fetchNotifications();
                await fetchUnreadCount();

                const unsubscribe = SocketManager.addNotificationListener((notification) => {
                    console.log('New notification received:', notification);
                    setNotifications(prev => [notification, ...prev]);
                    setUnreadCount(prevCount => prevCount + 1);
                });

                return unsubscribe;
            } catch (error) {
                console.error('Error initializing notifications:', error);
            }
        };

        initializeNotifications();

        const intervalId = setInterval(() => {
            fetchUnreadCount();
        }, 60000);

        fetchUnreadCount();

        return () => {
            SocketManager.disconnect();
            clearInterval(intervalId);
        };
    }, [fetchNotifications, fetchUnreadCount]);

    const markAsRead = async (notificationId) => {
        try {
            const BASE_URL = import.meta.env.VITE_LOCAL_BASE_URL;
            const token = localStorage.getItem('token');
            await axios.put(`${BASE_URL}/api/freelancer/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prevNotifications =>
                prevNotifications.map(notif =>
                    notif._id === notificationId ? { ...notif, is_read: true } : notif
                )
            );
            console.log("Notification ID being sent:", notificationId);

            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, fetchUnreadCount, fetchNotifications, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};
