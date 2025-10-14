import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Divider } from 'primereact/divider';
import { Tooltip } from 'primereact/tooltip';
import { useNotifications } from '../contexts/NotificationContext';
import '../assets/css/notification.css';

const NotificationBell = () => {
    const {
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();
    
    const op = useRef(null);

    // Format เวลา
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const notificationTypes = {
        'MAINTENANCE_SCHEDULE_CREATED': { icon: 'pi pi-plus-circle', color: '#28a745' },
        'MAINTENANCE_DUE': { icon: 'pi pi-exclamation-triangle', color: '#ffc107' },
        'MAINTENANCE_OVERDUE': { icon: 'pi pi-times-circle', color: '#dc3545' },
        'default': { icon: 'pi pi-info-circle', color: '#6c757d' }
    };

    const getTypeConfig = (type) => notificationTypes[type] || notificationTypes.default;

    return (
        <>
            <Tooltip target=".notification-bell" content="Notifications" position="bottom" />
            <div className="p-overlay-badge">
                <Button
                    icon="pi pi-bell"
                    className="p-button-rounded p-button-text topbar-btn notification-bell"
                    onClick={(e) => op.current.toggle(e)}
                />
                {unreadCount > 0 && (
                    <Badge 
                        value={unreadCount > 99 ? '99+' : unreadCount} 
                        severity="danger" 
                    />
                )}
            </div>

            <OverlayPanel 
                ref={op} 
                style={{ 
                    width: '400px', 
                    maxHeight: '600px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px'
                }}
                className="notification-panel"
                pt={{
                    content: { style: { padding: '16px', border: 'none' } },
                    root: { style: { border: 'none' } }
                }}
            >
                <div className="notification-header">
                    <h4 className="mb-2">Notifications</h4>
                    <div className="notification-actions">
                        <Button
                            label="Refresh"
                            icon="pi pi-refresh"
                            className="p-button-text p-button-sm"
                            onClick={refreshNotifications}
                            loading={loading}
                        />
                        {unreadCount > 0 && (
                            <Button
                                label="Mark all read"
                                icon="pi pi-check"
                                className="p-button-text p-button-sm"
                                onClick={markAllAsRead}
                            />
                        )}
                    </div>
                </div>
                
                <Divider />

                <ScrollPanel style={{ width: '100%', height: '350px' }}>
                    {loading ? (
                        <div className="text-center p-3">
                            <i className="pi pi-spin pi-spinner"></i> Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center p-3 text-muted">
                            <i className="pi pi-inbox" style={{ fontSize: '2rem' }}></i>
                            <p className="mt-2 mb-0">No notifications</p>
                        </div>
                    ) : (
                        <div className="notification-list">
                            {notifications.map((notification) => {
                                const typeConfig = getTypeConfig(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    >
                                        <div className="notification-content">
                                            <div className="notification-icon">
                                                <i 
                                                    className={typeConfig.icon} 
                                                    style={{ color: typeConfig.color }}
                                                ></i>
                                            </div>
                                            <div className="notification-details">
                                                <div 
                                                    className="notification-title"
                                                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                                                    style={{ cursor: !notification.isRead ? 'pointer' : 'default' }}
                                                >
                                                    {notification.title}
                                                    {!notification.isRead && (
                                                        <span className="unread-dot"></span>
                                                    )}
                                                </div>
                                                <div className="notification-message">
                                                    {notification.message}
                                                </div>
                                                <div className="notification-time">
                                                    {formatTime(notification.createdAt)}
                                                </div>
                                            </div>
                                            <div className="notification-actions">
                                                {!notification.isRead && (
                                                    <Button
                                                        icon="pi pi-check"
                                                        className="p-button-text p-button-rounded p-button-sm"
                                                        onClick={() => markAsRead(notification.id)}
                                                        tooltip="Mark as read"
                                                        tooltipOptions={{ position: 'top' }}
                                                    />
                                                )}
                                                <Button
                                                    icon="pi pi-times"
                                                    className="p-button-text p-button-rounded p-button-sm p-button-danger"
                                                    onClick={() => deleteNotification(notification.id)}
                                                    tooltip="Delete"
                                                    tooltipOptions={{ position: 'top' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollPanel>
            </OverlayPanel>
        </>
    );
};

export default NotificationBell;