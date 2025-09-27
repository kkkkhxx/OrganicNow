import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../component/Toast.jsx";
import { useAuth } from "../contexts/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  const [formData, setFormData] = useState({
    email: "Admin@admin.com",
    password: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showError("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    try {
      // Mock authentication - replace with real API later
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple mock validation
      if (formData.email === "Admin@admin.com" && formData.password === "password") {
        login(formData.email);
        showSuccess("Login successful!");
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        showError("Invalid email or password");
      }
    } catch (error) {
      showError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{
           background: "linear-gradient(135deg, #e6f3ff 0%, #87ceeb 50%, #4a90e2 100%)"
         }}>
      
      {/* Main Container */}
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            
            {/* Logo Section */}
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center text-white mb-3">
                <span style={{ fontSize: "2rem", marginRight: "0.5rem" }}>🥭</span>
                <h2 className="mb-0 fw-bold" style={{ fontSize: "1.8rem" }}>OrganicNow</h2>
              </div>
            </div>

            {/* Login Card */}
            <div className="card border-0 shadow-lg" style={{ borderRadius: "1rem" }}>
              <div className="card-body p-4">
                
                {/* Header */}
                <div className="text-center mb-4">
                  <h4 className="card-title fw-bold text-dark mb-0">Login to your account</h4>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  
                  {/* Email Field */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Email</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      style={{
                        border: "1px solid #e9ecef",
                        borderRadius: "0.5rem",
                        fontSize: "0.95rem"
                      }}
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label text-muted fw-semibold">Password</label>
                      <a href="#" className="text-primary text-decoration-none small">
                        Forgot ?
                      </a>
                    </div>
                    <div className="position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-lg"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        style={{
                          border: "1px solid #e9ecef",
                          borderRadius: "0.5rem",
                          fontSize: "0.95rem",
                          paddingRight: "3rem"
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="btn position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ zIndex: 10 }}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Login Button */}
                  <div className="d-grid gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg fw-semibold"
                      disabled={loading}
                      style={{
                        borderRadius: "0.5rem",
                        background: "linear-gradient(45deg, #0984e3, #74b9ff)",
                        border: "none",
                        fontSize: "1rem"
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Logging in...
                        </>
                      ) : (
                        "Login now"
                      )}
                    </button>
                  </div>
                </form>

                {/* Demo Credentials */}
                <div className="mt-4 p-3 bg-light rounded">
                  <small className="text-muted d-block mb-1">
                    <strong>Demo Credentials:</strong>
                  </small>
                  <small className="text-muted d-block">
                    Email: Admin@admin.com
                  </small>
                  <small className="text-muted">
                    Password: password
                  </small>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;