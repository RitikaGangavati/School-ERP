import { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function PasswordField({ value, onChange, error, disabled, ...rest }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className="input-group">
        <input
          type={showPassword ? "text" : "password"}
          className={`form-control ${error ? "is-invalid" : ""}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          tabIndex={-1}
        >
          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
        </button>
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
    </div>
  );
}