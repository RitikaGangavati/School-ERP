import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Nav, Tab } from "react-bootstrap";

import MainLayout from "../../components/layout/MainLayout";
import { useToast } from "../../components/common/ToastContext";
import { getClasses } from "../../services/classService";
import { getAcademicYears } from "../../services/academicYearService";
import { uploadPhoto } from "../../services/uploadService";
import { getCategories } from "../../services/categoryService";
import { getHouses } from "../../services/houseService";
import {
  getStudentById,
  createStudent,
  updateStudent,
} from "../../services/studentService";

const TABS = ["personal", "academic", "health", "parent", "address"];
const TAB_LABELS = {
  personal: "Personal Details",
  academic: "Academic Details",
  health: "Health Details",
  parent: "Parent / Guardian Detail",
  address: "Address Details",
};

const emptyForm = {
  personal: {
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    mobileNumber: "",
    email: "",
    aadhaarNo: "",
    religion: "",
    category: "",
    casteName: "",
    motherTongue: "",
    photo: "",
  },
  academic: {
    admissionNumber: "",
    admissionDate: "",
    academicYear: "",
    class: "",
    section: "",
    rollNo: "",
    house: "",
    status: "Active",
  },
  health: {
    bloodGroup: "",
    height: "",
    weight: "",
    medicalHistory: "",
  },
  parent: {
    fatherName: "",
    fatherPhone: "",
    fatherOccupation: "",
    fatherPhoto: "",
    motherName: "",
    motherPhone: "",
    motherOccupation: "",
    motherPhoto: "",
    guardianIs: "Father",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    guardianOccupation: "",
    guardianEmail: "",
    guardianPhoto: "",
    guardianAddress: "",
  },
  address: {
    sameAsGuardian: false,
    currentAddress: "",
    sameAsCurrent: false,
    permanentAddress: "",
  },
  active: true,
};

const toDateInput = (isoString) => (isoString ? isoString.slice(0, 10) : "");

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const [allClasses, setAllClasses] = useState([]);
  const [allYears, setAllYears] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [uploadingField, setUploadingField] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
const [allHouses, setAllHouses] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [classRes, yearRes, categoryRes, houseRes] = await Promise.all([
          getClasses(),
          getAcademicYears(),
           getCategories(),
        getHouses(),
        ]);
        setAllClasses(classRes.data.classes || []);
        setAllYears(yearRes.data.academicYears || []);
         setAllCategories(categoryRes.data.categories || []);
      setAllHouses(houseRes.data.houses || []);
      } catch (err) {
        setAllClasses([]);
        setAllYears([]);
         setAllCategories([]);
      setAllHouses([]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const fetchStudent = async () => {
      setLoading(true);
      try {
        const res = await getStudentById(id);
        const s = res.data.student;
        setForm({
          personal: {
            ...emptyForm.personal,
            ...s.personal,
            dob: toDateInput(s.personal?.dob),
             category: s.personal?.category?._id || "",
          },
          academic: {
            ...emptyForm.academic,
            ...s.academic,
            academicYear: s.academic?.academicYear?._id || "",
            class: s.academic?.class?._id || "",
            section: s.academic?.section?._id || "",
             house: s.academic?.house?._id || "",
            admissionDate: toDateInput(s.academic?.admissionDate),
          },
          health: { ...emptyForm.health, ...(s.health || {}) },
          parent: { ...emptyForm.parent, ...(s.parent || {}) },
          address: { ...emptyForm.address, ...(s.address || {}) },
          active: s.active,
        });
      } catch (err) {
        showToast(
          err.response?.data?.message || "Unable to load student.",
          "error",
        );
        navigate("/students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, isEdit, navigate, showToast]);

  const handleNestedChange = (group, field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
        ...(group === "academic" && field === "class" ? { section: "" } : {}),
      },
    }));
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Checking "Same as Guardian" copies Guardian Address into Current Address, and locks the field
  const handleSameAsGuardian = (e) => {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        sameAsGuardian: checked,
        currentAddress: checked
          ? prev.parent.guardianAddress
          : prev.address.currentAddress,
      },
    }));
  };

  // Checking "Same as Current" copies Current Address into Permanent Address, and locks the field
  const handleSameAsCurrent = (e) => {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        sameAsCurrent: checked,
        permanentAddress: checked
          ? prev.address.currentAddress
          : prev.address.permanentAddress,
      },
    }));
  };

  const selectedClassObj = allClasses.find(
    (c) => c._id === form.academic.class,
  );
  const availableSections = selectedClassObj?.sections || [];

  const validateTab = (tab) => {
    const errs = {};
    if (tab === "personal") {
      if (!form.personal.firstName.trim())
        errs.firstName = "First name is required";
      if (!form.personal.lastName.trim())
        errs.lastName = "Last name is required";
      if (!form.personal.dob) errs.dob = "Date of birth is required";
      if (!form.personal.gender) errs.gender = "Gender is required";
    }
    if (tab === "academic") {
      if (!form.academic.admissionNumber.trim())
        errs.admissionNumber = "Admission number is required";
      if (!form.academic.academicYear)
        errs.academicYear = "Academic year is required";
      if (!form.academic.class) errs.class = "Class is required";
      if (!form.academic.section) errs.section = "Section is required";
    }
    if (tab === "parent") {
      if (!form.parent.guardianName.trim())
        errs.guardianName = "Guardian name is required";
      if (!form.parent.guardianPhone.trim())
        errs.guardianPhone = "Guardian phone is required";
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
  const handlePhotoUpload = (group, field) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const res = await uploadPhoto(file, "students");
      setForm((prev) => ({
        ...prev,
        [group]: { ...prev[group], [field]: res.data.url },
      }));
      showToast("Photo uploaded");
    } catch (err) {
      showToast(err.response?.data?.message || "Photo upload failed", "error");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const personalOk = validateTab("personal");
    const academicOk = validateTab("academic");
    const parentOk = validateTab("parent");
    if (!personalOk) {
      setActiveTab("personal");
      return;
    }
    if (!academicOk) {
      setActiveTab("academic");
      return;
    }
    if (!parentOk) {
      setActiveTab("parent");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateStudent(id, form);
        showToast("Student updated successfully");
      } else {
        await createStudent(form);
        showToast("Student created successfully");
      }
      navigate("/students");
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
        <h4 className="fw-bold mb-0">
          {isEdit ? "Edit Student" : "Create Student"}
        </h4>

        <div className="card shadow-sm rounded-3">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <Tab.Container
                activeKey={activeTab}
                onSelect={(key) => setActiveTab(key)}
              >
                <Nav variant="tabs" className="mb-3">
                  {TABS.map((tab) => (
                    <Nav.Item key={tab}>
                      <Nav.Link eventKey={tab}>{TAB_LABELS[tab]}</Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>

                <Tab.Content>
                  {/* --- Personal Details Tab --- */}
                  <Tab.Pane eventKey="personal">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">
                          First Name <span className="text-danger">*</span>
                        </label>
                        <input
                          className={`form-control ${fieldErrors.firstName ? "is-invalid" : ""}`}
                          value={form.personal.firstName}
                          onChange={handleNestedChange("personal", "firstName")}
                          disabled={submitting}
                        />
                        {fieldErrors.firstName && (
                          <div className="invalid-feedback">
                            {fieldErrors.firstName}
                          </div>
                        )}
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label">
                          Last Name <span className="text-danger">*</span>
                        </label>
                        <input
                          className={`form-control ${fieldErrors.lastName ? "is-invalid" : ""}`}
                          value={form.personal.lastName}
                          onChange={handleNestedChange("personal", "lastName")}
                          disabled={submitting}
                        />
                        {fieldErrors.lastName && (
                          <div className="invalid-feedback">
                            {fieldErrors.lastName}
                          </div>
                        )}
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label">
                          DOB <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className={`form-control ${fieldErrors.dob ? "is-invalid" : ""}`}
                          value={form.personal.dob}
                          onChange={handleNestedChange("personal", "dob")}
                          disabled={submitting}
                        />
                        {fieldErrors.dob && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.dob}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">
                          Gender <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${fieldErrors.gender ? "is-invalid" : ""}`}
                          value={form.personal.gender}
                          onChange={handleNestedChange("personal", "gender")}
                          disabled={submitting}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {fieldErrors.gender && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.gender}
                          </div>
                        )}
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label">Mobile Number</label>
                        <input
                          className="form-control"
                          value={form.personal.mobileNumber}
                          onChange={handleNestedChange(
                            "personal",
                            "mobileNumber",
                          )}
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          className="form-control"
                          value={form.personal.email}
                          onChange={handleNestedChange("personal", "email")}
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Aadhaar No.</label>
                        <input
                          className="form-control"
                          value={form.personal.aadhaarNo}
                          onChange={handleNestedChange("personal", "aadhaarNo")}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Religion</label>
                        <input
                          className="form-control"
                          value={form.personal.religion}
                          onChange={handleNestedChange("personal", "religion")}
                          disabled={submitting}
                        />
                      </div>
                     <div className="col-md-4 mb-3">
  <label className="form-label">Category</label>
  <select
    className="form-select"
    value={form.personal.category}
    onChange={handleNestedChange("personal", "category")}
    disabled={submitting || loadingOptions}
  >
    <option value="">Select Category</option>
    {allCategories.map((c) => (
      <option key={c._id} value={c._id}>{c.categoryName}</option>
    ))}
  </select>
</div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Caste Name</label>
                        <input
                          className="form-control"
                          value={form.personal.casteName}
                          onChange={handleNestedChange("personal", "casteName")}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Mother Tongue</label>
                        <input
                          className="form-control"
                          value={form.personal.motherTongue}
                          onChange={handleNestedChange(
                            "personal",
                            "motherTongue",
                          )}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Student Photo</label>
                        <input
                          className="form-control"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload("personal", "photo")}
                          disabled={submitting || uploadingField === "photo"}
                        />
                        <div className="form-text">
                          {uploadingField === "photo"
                            ? "Uploading..."
                            : "100px × 100px recommended."}
                        </div>
                       
                      </div>
                    </div>
                  </Tab.Pane>

                  {/* --- Academic Details Tab --- */}
                  <Tab.Pane eventKey="academic">
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">
                          Admission No. <span className="text-danger">*</span>
                        </label>
                        <input
                          className={`form-control ${fieldErrors.admissionNumber ? "is-invalid" : ""}`}
                          value={form.academic.admissionNumber}
                          onChange={handleNestedChange(
                            "academic",
                            "admissionNumber",
                          )}
                          disabled={submitting}
                        />
                        {fieldErrors.admissionNumber && (
                          <div className="invalid-feedback">
                            {fieldErrors.admissionNumber}
                          </div>
                        )}
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">Admission Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={form.academic.admissionDate}
                          onChange={handleNestedChange(
                            "academic",
                            "admissionDate",
                          )}
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">
                          Academic Year <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${fieldErrors.academicYear ? "is-invalid" : ""}`}
                          value={form.academic.academicYear}
                          onChange={handleNestedChange(
                            "academic",
                            "academicYear",
                          )}
                          disabled={submitting || loadingOptions}
                        >
                          <option value="">Select Year</option>
                          {allYears.map((y) => (
                            <option key={y._id} value={y._id}>
                              {y.name}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.academicYear && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.academicYear}
                          </div>
                        )}
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">Roll No.</label>
                        <input
                          className="form-control"
                          value={form.academic.rollNo}
                          onChange={handleNestedChange("academic", "rollNo")}
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">
                          Class <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${fieldErrors.class ? "is-invalid" : ""}`}
                          value={form.academic.class}
                          onChange={handleNestedChange("academic", "class")}
                          disabled={submitting || loadingOptions}
                        >
                          <option value="">Select Class</option>
                          {allClasses.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.className}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.class && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.class}
                          </div>
                        )}
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">
                          Section <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${fieldErrors.section ? "is-invalid" : ""}`}
                          value={form.academic.section}
                          onChange={handleNestedChange("academic", "section")}
                          disabled={submitting || !form.academic.class}
                        >
                          <option value="">
                            {form.academic.class
                              ? "Select Section"
                              : "Select class first"}
                          </option>
                          {availableSections.map((sec) => (
                            <option key={sec._id} value={sec._id}>
                              {sec.sectionName}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.section && (
                          <div className="invalid-feedback d-block">
                            {fieldErrors.section}
                          </div>
                        )}
                      </div>

                      <div className="col-md-3 mb-3">
  <label className="form-label">House</label>
  <select
    className="form-select"
    value={form.academic.house}
    onChange={handleNestedChange("academic", "house")}
    disabled={submitting || loadingOptions}
  >
    <option value="">Select House</option>
    {allHouses.map((h) => (
      <option key={h._id} value={h._id}>{h.houseName}</option>
    ))}
  </select>
</div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={form.academic.status}
                          onChange={handleNestedChange("academic", "status")}
                          disabled={submitting}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Transferred">Transferred</option>
                          <option value="Graduated">Graduated</option>
                        </select>
                      </div>
                    </div>
                  </Tab.Pane>

                  {/* --- Health Details Tab --- */}
                  <Tab.Pane eventKey="health">
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Blood Group</label>
                        <input
                          className="form-control"
                          placeholder="e.g. O+"
                          value={form.health.bloodGroup}
                          onChange={handleNestedChange("health", "bloodGroup")}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Height (cm)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={form.health.height}
                          onChange={handleNestedChange("health", "height")}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Weight (kg)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={form.health.weight}
                          onChange={handleNestedChange("health", "weight")}
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Medical History</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={form.health.medicalHistory}
                        onChange={handleNestedChange(
                          "health",
                          "medicalHistory",
                        )}
                        disabled={submitting}
                      />
                    </div>
                  </Tab.Pane>

                  {/* --- Parent / Guardian Tab --- */}
                  {/* --- Parent / Guardian Tab --- */}
                  <Tab.Pane eventKey="parent">
                    <h6 className="fw-bold mb-3">Father's Details</h6>
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Father Name</label>
                        <input
                          className="form-control"
                          value={form.parent.fatherName}
                          onChange={handleNestedChange("parent", "fatherName")}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Father Phone</label>
                        <input
                          className="form-control"
                          value={form.parent.fatherPhone}
                          onChange={handleNestedChange("parent", "fatherPhone")}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Father Occupation</label>
                        <input
                          className="form-control"
                          value={form.parent.fatherOccupation}
                          onChange={handleNestedChange(
                            "parent",
                            "fatherOccupation",
                          )}
                          disabled={submitting}
                        />
                      </div>
                     <div className="col-md-3 mb-3">
  <label className="form-label">Father Photo</label>
  <input
    type="file"
    accept="image/*"
    className="form-control form-control-sm"
    onChange={handlePhotoUpload("parent", "fatherPhoto")}
    disabled={submitting || uploadingField === "fatherPhoto"}
  />
  {uploadingField === "fatherPhoto" && <div className="form-text">Uploading...</div>}
  {form.parent.fatherPhoto && (
    <img
      src={form.parent.fatherPhoto}
      alt="Father"
      className="mt-2 rounded"
      style={{ width: 60, height: 60, objectFit: "cover" }}
    />
  )}
</div>
                    </div>

                    <h6 className="fw-bold mb-3">Mother's Details</h6>
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Mother Name</label>
                        <input
                          className="form-control"
                          value={form.parent.motherName}
                          onChange={handleNestedChange("parent", "motherName")}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Mother Phone</label>
                        <input
                          className="form-control"
                          value={form.parent.motherPhone}
                          onChange={handleNestedChange("parent", "motherPhone")}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Mother Occupation</label>
                        <input
                          className="form-control"
                          value={form.parent.motherOccupation}
                          onChange={handleNestedChange(
                            "parent",
                            "motherOccupation",
                          )}
                          disabled={submitting}
                        />
                      </div>
                     <div className="col-md-3 mb-3">
  <label className="form-label">Mother Photo (100px × 100px)</label>
  <input
    type="file"
    accept="image/*"
    className="form-control form-control-sm"
    onChange={handlePhotoUpload("parent", "motherPhoto")}
    disabled={submitting || uploadingField === "motherPhoto"}
  />
  {uploadingField === "motherPhoto" && <div className="form-text">Uploading...</div>}
  {form.parent.motherPhoto && (
    <img
      src={form.parent.motherPhoto}
      alt="Mother"
      className="mt-2 rounded"
      style={{ width: 60, height: 60, objectFit: "cover" }}
    />
  )}
</div>
                    </div>

                    <hr />
                    <h6 className="fw-bold mb-3">Guardian Details</h6>
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">
                          If Guardian Is <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={form.parent.guardianIs}
                          onChange={handleNestedChange("parent", "guardianIs")}
                          disabled={submitting}
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">
                          Guardian Name <span className="text-danger">*</span>
                        </label>
                        <input
                          className={`form-control ${fieldErrors.guardianName ? "is-invalid" : ""}`}
                          value={form.parent.guardianName}
                          onChange={handleNestedChange(
                            "parent",
                            "guardianName",
                          )}
                          disabled={submitting}
                        />
                        {fieldErrors.guardianName && (
                          <div className="invalid-feedback">
                            {fieldErrors.guardianName}
                          </div>
                        )}
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">Guardian Relation</label>
                        <input
                          className="form-control"
                          value={form.parent.guardianRelation}
                          onChange={handleNestedChange(
                            "parent",
                            "guardianRelation",
                          )}
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label">
                          Guardian Phone <span className="text-danger">*</span>
                        </label>
                        <input
                          className={`form-control ${fieldErrors.guardianPhone ? "is-invalid" : ""}`}
                          value={form.parent.guardianPhone}
                          onChange={handleNestedChange(
                            "parent",
                            "guardianPhone",
                          )}
                          disabled={submitting}
                        />
                        {fieldErrors.guardianPhone && (
                          <div className="invalid-feedback">
                            {fieldErrors.guardianPhone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <label className="form-label">
                          Guardian Occupation
                        </label>
                        <input
                          className="form-control"
                          value={form.parent.guardianOccupation}
                          onChange={handleNestedChange(
                            "parent",
                            "guardianOccupation",
                          )}
                          disabled={submitting}
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Guardian Email</label>
                        <input
                          className="form-control"
                          value={form.parent.guardianEmail}
                          onChange={handleNestedChange(
                            "parent",
                            "guardianEmail",
                          )}
                          disabled={submitting}
                        />
                      </div>
                     <div className="col-md-3 mb-3">
  <label className="form-label">Guardian Photo (100px × 100px)</label>
  <input
    type="file"
    accept="image/*"
    className="form-control form-control-sm"
    onChange={handlePhotoUpload("parent", "guardianPhoto")}
    disabled={submitting || uploadingField === "guardianPhoto"}
  />
  {uploadingField === "guardianPhoto" && <div className="form-text">Uploading...</div>}
  {form.parent.guardianPhoto && (
    <img
      src={form.parent.guardianPhoto}
      alt="Guardian"
      className="mt-2 rounded"
      style={{ width: 60, height: 60, objectFit: "cover" }}
    />
  )}
</div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Guardian Address</label>
                        <textarea
                          className="form-control"
                          rows={1}
                          value={form.parent.guardianAddress}
                          onChange={handleNestedChange(
                            "parent",
                            "guardianAddress",
                          )}
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </Tab.Pane>

                  {/* --- Address Tab --- */}
                  <Tab.Pane eventKey="address">
                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="sameAsGuardian"
                        checked={form.address.sameAsGuardian}
                        onChange={handleSameAsGuardian}
                        disabled={submitting}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="sameAsGuardian"
                      >
                        If Guardian Address Is Current Address
                      </label>
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Current Address</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={form.address.currentAddress}
                        onChange={handleNestedChange(
                          "address",
                          "currentAddress",
                        )}
                        disabled={submitting || form.address.sameAsGuardian}
                      />
                    </div>

                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="sameAsCurrent"
                        checked={form.address.sameAsCurrent}
                        onChange={handleSameAsCurrent}
                        disabled={submitting}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="sameAsCurrent"
                      >
                        If Permanent Address Is Current Address
                      </label>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Permanent Address</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={form.address.permanentAddress}
                        onChange={handleNestedChange(
                          "address",
                          "permanentAddress",
                        )}
                        disabled={submitting || form.address.sameAsCurrent}
                      />
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>

              {/* --- Navigation buttons: Back / Next / Save --- */}
              <div className="d-flex justify-content-between mt-3">
                <div>
                  {currentIndex > 0 && (
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={(e) => {
                        e.preventDefault();
                        handleBack();
                      }}
                      disabled={submitting}
                    >
                      Back
                    </button>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/students")}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  {!isLastTab ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNext();
                      }}
                      disabled={submitting}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Saving..."
                        : isEdit
                          ? "Update Student"
                          : "Save Student"}
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
