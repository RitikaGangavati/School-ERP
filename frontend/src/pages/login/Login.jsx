import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";

import SchoolIcon from "@mui/icons-material/School";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import PasswordField from "../../components/Common/PasswordField";
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
  const [error, setError] = useState(""); // for server/network errors
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

    if (!validateFields()) {
      return;
    }

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
        }),
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
    <Box sx={{ height: "100vh", display: "flex", bgcolor: "#fff" }}>
      {/* Left Side - Image */}
      <Box
        sx={{
          width: "55%",
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#fff",
          p: 4,
        }}
      >
        <Box
          component="img"
          src={LoginImage}
          alt="Login illustration"
          sx={{
            width: "100%",
            maxWidth: 640,
            height: "auto",
            objectFit: "contain",
          }}
        />
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          width: { xs: "100%", md: "45%" },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#fff",
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width: "85%",
            maxWidth: 420,
            p: 5,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "grey.100",
          }}
        >
          <Stack spacing={3}>
            <Box textAlign="center">
              <SchoolIcon color="primary" sx={{ fontSize: 60 }} />

              <Typography variant="h4" fontWeight="bold">
                School ERP
              </Typography>

              <Typography color="text.secondary">
                Sign in to continue
              </Typography>
            </Box>

            {/* General/server-level errors only */}
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              error={!!emailError}
              helperText={emailError}
              disabled={loading}
            />

            <PasswordField
              label="Password"
              fullWidth
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              error={!!passwordError}
              helperText={passwordError}
              disabled={loading}
            />

            <Typography
              align="right"
              color="primary"
              sx={{ cursor: "pointer" }}
            >
              Forgot Password?
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Login"
              )}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
