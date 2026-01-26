import axios from 'axios';
import { useEffect, useState } from 'react';
import './Notifications.css';

function Notifications({ onUpdate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications?username=${username}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`);
      await fetchNotifications();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('http://localhost:5000/api/notifications/read-all', { username });
      await fetchNotifications();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return <div className="loading-state">Loading notifications...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔔</div>
        <h3>No notifications</h3>
        <p>You don't have any notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="notifications">
      <div className="notifications-header">
        <div className="header-title-section">
          <h2>Notifications</h2>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount} unread</span>}
        </div>
        {unreadCount > 0 && (
          <button className="btn-sm btn-outline" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.map((notification) => (
          <div key={notification._id} className={`notification-card ${!notification.read ? 'unread' : ''}`} onClick={() => !notification.read && handleMarkAsRead(notification._id)}>
            <div className="notification-content">
              <div className="notification-icon">{notification.type === 'return_request' ? '📚' : '🔔'}</div>
              <div className="notification-info">
                <p className="notification-message">{notification.message}</p>
                <p className="notification-date">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
              {!notification.read && <div className="unread-indicator"></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
