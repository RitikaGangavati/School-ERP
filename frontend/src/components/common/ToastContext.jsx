import { createContext, useContext, useState, useCallback } from "react";
import { ToastContainer, Toast } from "react-bootstrap";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success",
  });

  const showToast = useCallback((message, variant = "success") => {
    setToast({ show: true, message, variant });
  }, []);

  const handleClose = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <ToastContainer
        position="top-center"
        className="p-3"
        style={{ zIndex: 2000, marginTop: 64 }}
      >
        <Toast
          show={toast.show}
          onClose={handleClose}
          delay={3000}
          autohide
          bg={toast.variant === "error" ? "danger" : toast.variant}
        >
          <Toast.Body className={toast.variant === "error" || toast.variant === "danger" ? "text-white" : ""}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}