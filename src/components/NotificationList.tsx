import React, { useEffect, useState } from 'react';

type NotificationType = 'info' | 'warning' | 'success' | 'error';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar notificações');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar notificações');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao marcar notificação como lida');
      }

      // Atualiza a lista de notificações
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar notificação como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao marcar todas as notificações como lidas');
      }

      // Atualiza todas as notificações como lidas
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar todas as notificações como lidas');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return <div>Carregando notificações...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <>
      <style>{`
        .notifications-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notification {
          padding: 15px;
          border-radius: 8px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification.unread {
          border-left: 4px solid #007bff;
        }

        .notification.read {
          opacity: 0.7;
        }

        .notification.info {
          border-left-color: #17a2b8;
        }

        .notification.warning {
          border-left-color: #ffc107;
        }

        .notification.success {
          border-left-color: #28a745;
        }

        .notification.error {
          border-left-color: #dc3545;
        }

        .notification-content {
          flex: 1;
        }

        .notification-content h3 {
          margin: 0 0 5px 0;
          font-size: 1.1em;
        }

        .notification-content p {
          margin: 0 0 5px 0;
          color: #666;
        }

        .notification-content small {
          color: #999;
        }

        .mark-read, .mark-all-read {
          padding: 5px 10px;
          border: none;
          border-radius: 4px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          font-size: 0.9em;
        }

        .mark-read:hover, .mark-all-read:hover {
          background-color: #0056b3;
        }

        .error {
          color: #dc3545;
          padding: 10px;
          border-radius: 4px;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
        }
      `}</style>
      <div className="notifications-container">
        <div className="notifications-header">
          <h2>Notificações</h2>
          {notifications.some(n => !n.read) && (
            <button onClick={markAllAsRead} className="mark-all-read">
              Marcar todas como lidas
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p>Nenhuma notificação</p>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`notification ${notification.type} ${notification.read ? 'read' : 'unread'}`}
              >
                <div className="notification-content">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.timestamp).toLocaleString()}</small>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="mark-read"
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationList; 