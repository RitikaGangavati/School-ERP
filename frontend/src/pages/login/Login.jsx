import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import SchoolIcon from "@mui/icons-material/School";
import PasswordField from "../../components/common/PasswordField";
import { loginUser } from "../../services/authService";
import { loginSuccess } from "../../redux/auth/authSlice";
import LoginImage from "../../assets/login-image-1.png";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateFields = () => {
    let isValid = true;

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    if (!validateFields()) return;

    setLoading(true);
    try {
      const res = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.data.success) {
        setError(res.data.message || "Login failed. Please try again.");
        return;
      }

      dispatch(
        loginSuccess({
          token: res.data.token,
          user: res.data.user,
        })
      );
      navigate("/dashboard");
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        if (status === 404) {
          setEmailError(serverMessage || "No account found with this email");
        } else if (status === 401) {
          setPasswordError(serverMessage || "Incorrect password");
        } else if (status === 400) {
          setError(serverMessage || "Please check your details and try again");
        } else if (status >= 500) {
          setError("Something went wrong on our end. Please try again shortly");
        } else {
          setError(serverMessage || "Login failed. Please try again");
        }
      } else if (err.request) {
        setError("Unable to reach the server. Please check your connection");
      } else {
        setError("Something went wrong. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100 bg-white">
      {/* Left Side - Image */}
      <div className="d-none d-md-flex align-items-center justify-content-center p-4" style={{ width: "55%" }}>
        <img
          src={LoginImage}
          alt="Login illustration"
          className="img-fluid"
          style={{ maxWidth: 640 }}
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="d-flex align-items-center justify-content-center flex-grow-1">
        <div
          className="shadow rounded-4 border p-5"
          style={{ width: "85%", maxWidth: 420 }}
        >
          <div className="text-center mb-3">
            <SchoolIcon color="primary" style={{ fontSize: 60 }} />
            <h4 className="fw-bold mt-1">School ERP</h4>
            <p className="text-muted">Sign in to continue</p>
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="text"
                className={`form-control ${emailError ? "is-invalid" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                disabled={loading}
              />
              {emailError && <div className="invalid-feedback">{emailError}</div>}
            </div>

            <div className="mb-2">
              <label className="form-label">Password</label>
              <PasswordField
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                error={passwordError}
                disabled={loading}
              />
            </div>

            <div className="text-end mb-3">
              <span className="text-primary" style={{ cursor: "pointer", fontSize: "0.9rem" }}>
                Forgot Password?
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" animation="border" /> : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}