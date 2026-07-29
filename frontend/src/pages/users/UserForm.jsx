import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../components/layout/MainLayout";
import PasswordField from "../../components/common/PasswordField";
import { useToast } from "../../components/common/ToastContext";
import { getRoles } from "../../services/roleService";
import {
  getUserById,
  createUser,
  updateUser,
} from "../../services/userService";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  mobile: "",
  role: "",
  active: true,
};

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();

  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      const res = await getRoles();
      setRoles(res.data.roles);
    };

    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await getRoles();
      console.log(res.data);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!isEdit) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await getUserById(id);
        const u = res.data.user;
        setForm({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          password: "",
          mobile: u.mobile,
          role: u.role?._id,
          active: u.active,
        });
      } catch (err) {
        showToast(
          err.response?.data?.message || "Unable to load user.",
          "error",
        );
        navigate("/users");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, isEdit, navigate, showToast]);

  const handleChange = (field) => (e) => {
    const value = field === "active" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!form.mobile.trim()) errs.mobile = "Mobile number is required";
    if (!isEdit && !form.password.trim())
      errs.password = "Password is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = isEdit
        ? {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            mobile: form.mobile.trim(),
            role: form.role,
            active: form.active,
          }
        : { ...form };

      if (isEdit) {
        await updateUser(id, payload);
        showToast("User updated successfully");
      } else {
        await createUser(payload);
        showToast("User created successfully");
      }
      navigate("/users");
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="d-flex flex-column gap-3">
        <h4 className="fw-bold mb-0">{isEdit ? "Edit User" : "Create User"}</h4>

        <div className="card shadow-sm rounded-3">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* First Name + Last Name */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    First Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.firstName ? "is-invalid" : ""}`}
                    value={form.firstName}
                    onChange={handleChange("firstName")}
                    disabled={submitting}
                  />
                  {fieldErrors.firstName && (
                    <div className="invalid-feedback">
                      {fieldErrors.firstName}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.lastName ? "is-invalid" : ""}`}
                    value={form.lastName}
                    onChange={handleChange("lastName")}
                    disabled={submitting}
                  />
                  {fieldErrors.lastName && (
                    <div className="invalid-feedback">
                      {fieldErrors.lastName}
                    </div>
                  )}
                </div>
              </div>

              {/* Email + Mobile */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                    value={form.email}
                    onChange={handleChange("email")}
                    disabled={submitting}
                  />
                  {fieldErrors.email && (
                    <div className="invalid-feedback">{fieldErrors.email}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Mobile <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.mobile ? "is-invalid" : ""}`}
                    value={form.mobile}
                    onChange={handleChange("mobile")}
                    disabled={submitting}
                  />
                  {fieldErrors.mobile && (
                    <div className="invalid-feedback">{fieldErrors.mobile}</div>
                  )}
                </div>
              </div>

              {/* Password + Role — side by side */}
              <div className="row">
                {!isEdit && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Password <span className="text-danger">*</span>
                    </label>
                    <PasswordField
                      value={form.password}
                      onChange={handleChange("password")}
                      error={fieldErrors.password}
                      disabled={submitting}
                    />
                  </div>
                )}

                <div className="col-md-6 mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={form.role}
                    onChange={handleChange("role")}
                  >
                    <option value="">Select Role</option>

                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={form.active}
                  onChange={handleChange("active")}
                  disabled={submitting}
                  id="userActiveSwitch"
                />
                <label className="form-check-label" htmlFor="userActiveSwitch">
                  {form.active ? "Active" : "Inactive"}
                </label>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => navigate("/users")}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
