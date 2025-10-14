// Route Guard - ป้องกันการเข้าถึงโดยตรง
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const useRouteGuard = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ถ้าไม่ loading แล้วและไม่ได้ login และไม่ได้อยู่ในหน้า login
    if (!loading && !isAuthenticated && location.pathname !== '/login') {
      console.log('🚫 Unauthorized access detected, redirecting to login');
      navigate('/login', { 
        replace: true, 
        state: { from: location } 
      });
    }
  }, [isAuthenticated, loading, location, navigate]);

  return { isAuthenticated, loading };
};

export default useRouteGuard;