import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Nav, Tab } from "react-bootstrap";

import MainLayout from "../../components/layout/MainLayout";
import PasswordField from "../../components/common/PasswordField";
import { useToast } from "../../context/ToastContext";
import { getSubjects } from "../../services/subjectService";
import { uploadPhoto } from "../../services/uploadService";
import { getImageUrl } from "../../utils/getImageUrl";
import {
  getTeacherById,
  createTeacher,
  updateTeacher,
} from "../../services/teacherService";

const TABS = ["personal", "employment"];
const TAB_LABELS = { personal: "Personal Details", employment: "Employment Details" };

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  dob: "",
  gender: "",
  mobile: "",
  photo: "",
  employeeId: "",
  joiningDate: "",
  designation: "",
  department: "",
  subjects: [],
  qualification: "",
  experience: "",
  status: "Active",
  active: true,
};

const toDateInput = (isoString) => (isoString ? isoString.slice(0, 10) : "");

export default function TeacherForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [allSubjects, setAllSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await getSubjects();
        setAllSubjects(res.data.subjects || []);
      } catch (err) {
        setAllSubjects([]);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const fetchTeacher = async () => {
      setLoading(true);
      try {
        const res = await getTeacherById(id);
        const t = res.data.teacher;
        setForm({
          firstName: t.firstName || "",
          lastName: t.lastName || "",
          email: t.userId?.email || "",
          password: "", // never pre-filled or editable here
          dob: toDateInput(t.dob),
          gender: t.gender || "",
          mobile: t.mobile || "",
          photo: t.photo || "",
          employeeId: t.employeeId || "",
          joiningDate: toDateInput(t.joiningDate),
          designation: t.designation || "",
          department: t.department || "",
          subjects: t.subjects?.map((s) => s._id) || [],
          qualification: t.qualification || "",
          experience: t.experience ?? "",
          status: t.status || "Active",
          active: t.active,
        });
      } catch (err) {
        showToast(err.response?.data?.message || "Unable to load teacher.", "error");
        navigate("/teachers");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id, isEdit, navigate, showToast]);

  const handleChange = (field) => (e) => {
    const value = field === "active" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleSubject = (subjectId) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter((s) => s !== subjectId)
        : [...prev.subjects, subjectId],
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadPhoto(file, "teachers");
      setForm((prev) => ({ ...prev, photo: res.data.url }));
      showToast("Photo uploaded");
    } catch (err) {
      showToast(err.response?.data?.message || "Photo upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const validateTab = (tab) => {
    const errs = {};
    if (tab === "personal") {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim()) errs.lastName = "Last name is required";
      if (!form.email.trim()) errs.email = "Email is required";
      if (!isEdit && !form.password.trim()) errs.password = "Password is required";
      if (!form.dob) errs.dob = "Date of birth is required";
      if (!form.gender) errs.gender = "Gender is required";
    }
    if (tab === "employment") {
      if (!form.employeeId.trim()) errs.employeeId = "Employee ID is required";
      if (form.subjects.length === 0) errs.subjects = "Select at least one subject";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const currentIndex = TABS.indexOf(activeTab);
  const isLastTab = currentIndex === TABS.length - 1;

  const handleNext = () => {
    if (!validateTab(activeTab)) return;
    setActiveTab(TABS[currentIndex + 1]);
  };

  const handleBack = () => {
    setFieldErrors({});
    setActiveTab(TABS[currentIndex - 1]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const personalOk = validateTab("personal");
    const employmentOk = validateTab("employment");
    if (!personalOk) { setActiveTab("personal"); return; }
    if (!employmentOk) { setActiveTab("employment"); return; }

    setSubmitting(true);
    try {
      const payload = isEdit
        ? { ...form, password: undefined } // never send password on update
        : form;

      if (isEdit) {
        await updateTeacher(id, payload);
        showToast("Teacher updated successfully");
      } else {
        await createTeacher(payload);
        showToast("Teacher created successfully");
      }
      navigate("/teachers");
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong. Please try again.", "error");
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
        <h4 className="fw-bold mb-0">{isEdit ? "Edit Teacher" : "Create Teacher"}</h4>

        <div className="card shadow-sm rounded-3">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
                <Nav variant="tabs" className="mb-3">
                  {TABS.map((tab) => (
                    <Nav.Item key={tab}>
                      <Nav.Link eventKey={tab}>{TAB_LABELS[tab]}</Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>

                <Tab.Content>
                  {/* --- Personal --- */}
                  <Tab.Pane eventKey="personal">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">First Name <span className="text-danger">*</span></label>
                        <input
                          className={`form-control ${fieldErrors.firstName ? "is-invalid" : ""}`}
                          value={form.firstName}
                          onChange={handleChange("firstName")}
                          disabled={submitting}
                        />
                        {fieldErrors.firstName && <div className="invalid-feedback">{fieldErrors.firstName}</div>}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Last Name <span className="text-danger">*</span></label>
                        <input
                          className={`form-control ${fieldErrors.lastName ? "is-invalid" : ""}`}
                          value={form.lastName}
                          onChange={handleChange("lastName")}
                          disabled={submitting}
                        />
                        {fieldErrors.lastName && <div className="invalid-feedback">{fieldErrors.lastName}</div>}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">DOB <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className={`form-control ${fieldErrors.dob ? "is-invalid" : ""}`}
                          value={form.dob}
                          onChange={handleChange("dob")}
                          disabled={submitting}
                        />
                        {fieldErrors.dob && <div className="invalid-feedback d-block">{fieldErrors.dob}</div>}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Gender <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${fieldErrors.gender ? "is-invalid" : ""}`}
                          value={form.gender}
                          onChange={handleChange("gender")}
                          disabled={submitting}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {fieldErrors.gender && <div className="invalid-feedback d-block">{fieldErrors.gender}</div>}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Mobile</label>
                        <input className="form-control" value={form.mobile} onChange={handleChange("mobile")} disabled={submitting} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Email <span className="text-danger">*</span></label>
                        <input
                          className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                          value={form.email}
                          onChange={handleChange("email")}
                          disabled={submitting || isEdit}
                        />
                        {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                        {isEdit && <div className="form-text">Email is linked to this teacher's login account.</div>}
                      </div>
                    </div>

                    {!isEdit && (
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Password <span className="text-danger">*</span></label>
                          <PasswordField
                            value={form.password}
                            onChange={handleChange("password")}
                            error={fieldErrors.password}
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label">Photo</label>
                      <input
                        className="form-control"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={submitting || uploading}
                      />
                      {form.photo && (
                        <img src={getImageUrl(form.photo)} alt="Teacher" className="mt-2 rounded" style={{ width: 80, height: 80, objectFit: "cover" }} />
                      )}
                    </div>
                  </Tab.Pane>

                  {/* --- Employment --- */}
                  <Tab.Pane eventKey="employment">
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Employee ID <span className="text-danger">*</span></label>
                        <input
                          className={`form-control ${fieldErrors.employeeId ? "is-invalid" : ""}`}
                          value={form.employeeId}
                          onChange={handleChange("employeeId")}
                          disabled={submitting}
                        />
                        {fieldErrors.employeeId && <div className="invalid-feedback">{fieldErrors.employeeId}</div>}
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Joining Date</label>
                        <input type="date" className="form-control" value={form.joiningDate} onChange={handleChange("joiningDate")} disabled={submitting} />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Designation</label>
                        <input className="form-control" value={form.designation} onChange={handleChange("designation")} disabled={submitting} />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Department</label>
                        <input className="form-control" value={form.department} onChange={handleChange("department")} disabled={submitting} />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Qualification</label>
                        <input className="form-control" value={form.qualification} onChange={handleChange("qualification")} disabled={submitting} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Experience (years)</label>
                        <input type="number" className="form-control" value={form.experience} onChange={handleChange("experience")} disabled={submitting} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={handleChange("status")} disabled={submitting}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
  <label className="form-label">
    Subjects Taught <span className="text-danger">*</span>
  </label>
  <div className="d-flex flex-wrap gap-2">
    {allSubjects.map((sub) => {
      const isChecked = form.subjects.includes(sub._id);
      return (
        <div
          key={sub._id}
          onClick={() => !submitting && toggleSubject(sub._id)}
          className={`px-3 py-1 rounded-pill border ${isChecked ? "bg-primary text-white border-primary" : "bg-white text-dark"}`}
          style={{ cursor: submitting ? "default" : "pointer", userSelect: "none" }}
        >
          {sub.subjectName}
        </div>
      );
    })}
  </div>
  {fieldErrors.subjects && (
    <div className="text-danger small mt-1">{fieldErrors.subjects}</div>
  )}
</div>

                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={form.active}
                        onChange={handleChange("active")}
                        disabled={submitting}
                        id="teacherActiveSwitch"
                      />
                      <label className="form-check-label" htmlFor="teacherActiveSwitch">
                        {form.active ? "Active" : "Inactive"}
                      </label>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>

              <div className="d-flex justify-content-between mt-3">
                <div>
                  {currentIndex > 0 && (
                    <button type="button" className="btn btn-light" onClick={(e) => { e.preventDefault(); handleBack(); }} disabled={submitting}>
                      Back
                    </button>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/teachers")} disabled={submitting}>
                    Cancel
                  </button>

                  {!isLastTab ? (
                    <button type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); handleNext(); }} disabled={submitting}>
                      Next
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-success" disabled={submitting}>
                      {submitting ? "Saving..." : isEdit ? "Update Teacher" : "Save Teacher"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}