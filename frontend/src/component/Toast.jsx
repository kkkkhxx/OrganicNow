import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Toast Context - สำหรับแชร์ Toast functions ทั่วทั้งแอป
 */
const ToastContext = createContext();

/**
 * Hook สำหรับใช้ Toast ในหน้าต่างๆ
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast ต้องใช้ภายใน ToastProvider นะ');
    }
    return context;
};

/**
 * Toast Provider - ต้องวางไว้รอบๆ App
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // ฟังก์ชันเพิ่ม toast ใหม่
    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random(); // สร้าง unique id
        const newToast = { id, message, type, duration };
        
        setToasts(prev => [...prev, newToast]);
        
        // ลบ toast อัตโนมัติหลังจากเวลาที่กำหนด
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);
    }, []);

    // ฟังก์ชันลบ toast ด้วยตัวเอง
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // ฟังก์ชันลัดสำหรับแต่ละประเภท
    const showSuccess = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const showError = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const showWarning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
    const showInfo = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

    return (
        <ToastContext.Provider value={{ 
            addToast, 
            removeToast, 
            showSuccess, 
            showError, 
            showWarning, 
            showInfo 
        }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

/**
 * Toast Container - แสดง toasts ทั้งหมด
 */
const ToastContainer = ({ toasts, removeToast }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

/**
 * Toast Component - toast แต่ละอัน
 */
const Toast = ({ toast, onClose }) => {
    const getToastClass = () => {
        switch (toast.type) {
            case 'success': return 'text-bg-success';
            case 'error': return 'text-bg-danger';
            case 'warning': return 'text-bg-warning';
            case 'info': return 'text-bg-info';
            default: return 'text-bg-light';
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '📝';
        }
    };

    return (
        <div 
            className={`toast show ${getToastClass()}`} 
            role="alert" 
            style={{ minWidth: '300px', marginBottom: '10px' }}
        >
            <div className="toast-header">
                <span className="me-2">{getIcon()}</span>
                <strong className="me-auto">
                    {toast.type === 'success' && 'สำเร็จ'}
                    {toast.type === 'error' && 'ผิดพลาด'}
                    {toast.type === 'warning' && 'คำเตือน'}
                    {toast.type === 'info' && 'แจ้งเตือน'}
                </strong>
                <button 
                    type="button" 
                    className="btn-close" 
                    onClick={onClose}
                    aria-label="Close"
                />
            </div>
            <div className="toast-body">
                {toast.message}
            </div>
        </div>
    );
};