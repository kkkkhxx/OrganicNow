import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Function to validate session
  const validateSession = async () => {
    try {
      const authStatus = localStorage.getItem('isAuthenticated');
      const userEmail = localStorage.getItem('userEmail');
      const loginTime = localStorage.getItem('loginTime');
      
      // Check if authentication exists and is still valid (24 hours)
      if (authStatus === 'true' && userEmail && loginTime) {
        const currentTime = new Date().getTime();
        const sessionExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
        if (currentTime - parseInt(loginTime) < sessionExpiry) {
          // Session is still valid
          setIsAuthenticated(true);
          setUser({ email: userEmail });
          return true;
        } else {
          // Session expired, clear storage
          logout();
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      logout();
      return false;
    }
  };

  useEffect(() => {
    // Validate session on app startup
    const initAuth = async () => {
      setLoading(true);
      await validateSession();
      setLoading(false);
    };
    
    initAuth();

    // ✅ Check session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // ✅ Listen for storage changes (multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated' && e.newValue === null) {
        // Logged out in another tab
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (email) => {
    const loginTime = new Date().getTime().toString();
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('loginTime', loginTime);
    
    setIsAuthenticated(true);
    setUser({ email });
    
    console.log('✅ User logged in:', email);
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    
    setIsAuthenticated(false);
    setUser(null);
    
    console.log('🚪 User logged out');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    validateSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};