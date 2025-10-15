import React, { useState, useEffect } from 'react';
import '../assets/css/toast-notification.css';

const ToastNotification = ({ message, title, type = 'notification', duration = 8000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300); // Wait for animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'notification': return '🔔';
            case 'urgent': return '🚨';
            case 'due': return '📅';
            default: return 'ℹ️';
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
    };

    return (
        <div className={`toast-notification toast-${type} ${isVisible ? 'toast-show' : 'toast-hide'}`}>
            <div className="toast-header">
                <div className="toast-icon">{getIcon()}</div>
                <div className="toast-title">{title}</div>
                <button className="toast-close" onClick={handleClose}>×</button>
            </div>
            <div className="toast-message">{message}</div>
        </div>
    );
};

export default ToastNotification;