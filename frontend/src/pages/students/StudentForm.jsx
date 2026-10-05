import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Accordion } from "react-bootstrap";

import MainLayout from "../../components/layout/MainLayout";
import { useToast } from "../../context/ToastContext";
import { getClasses } from "../../services/classService";
import { getAcademicYears } from "../../services/academicYearService";
import { uploadPhoto, uploadFile } from "../../services/uploadService";
import { getCategories } from "../../services/categoryService";
import { getHouses } from "../../services/houseService";
import {
  getStudentById,
  createStudent,
  updateStudent,
} from "../../services/studentService";

const SECTIONS = [
  "personal",
  "academic",
  "parent",
  "address",
  "health",
  "documents",
];
const SECTION_LABELS = {
  personal: "👤 Personal Details",
  academic: "🎓 Academic Details",
  parent: "👨‍👩‍👧 Parent / Guardian Detail",
  address: "📍 Address Details",
  health: "🩺 Health Details",
  documents: "📁 Documents",
};

const emptyForm = {
  personal: {
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    birthPlace: "",
    gender: "",
    mobile: "",
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
    admissionType: "New Admission",
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
    allergies: "",
    disability: "",
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
    annualIncome: "",
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
  documents: {
    birthCertificate: "",
    transferCertificate: "",
    aadhaarDoc: "",
    marksCard: "",
    others: "",
  },
  active: true,
};

const toDateInput = (isoString) => (isoString ? isoString.slice(0, 10) : "");

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  // Which accordion sections are currently expanded (multiple can be open at once)
  const [openSections, setOpenSections] = useState(["personal"]);
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

        // Convert documents array [{name, file}] back into the flat object the form uses
        const documentsObj = { ...emptyForm.documents };
        (s.documents || []).forEach((doc) => {
          if (doc.name in documentsObj) documentsObj[doc.name] = doc.file;
        });

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
          documents: documentsObj, // ← use the converted object
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

  // Field -> section map, used to know which accordion panel to expand on error
  const FIELD_SECTION = {
    firstName: "personal",
    lastName: "personal",
    dob: "personal",
    gender: "personal",
    admissionNumber: "academic",
    academicYear: "academic",
    class: "academic",
    section: "academic",
    guardianName: "parent",
    guardianPhone: "parent",
  };

  const validateSection = (section) => {
    const errs = {};
    if (section === "personal") {
      if (!form.personal.firstName.trim())
        errs.firstName = "First name is required";
      if (!form.personal.lastName.trim())
        errs.lastName = "Last name is required";
      if (!form.personal.dob) errs.dob = "Date of birth is required";
      if (!form.personal.gender) errs.gender = "Gender is required";
    }
    if (section === "academic") {
      if (!form.academic.admissionNumber.trim())
        errs.admissionNumber = "Admission number is required";
      if (!form.academic.academicYear)
        errs.academicYear = "Academic year is required";
      if (!form.academic.class) errs.class = "Class is required";
      if (!form.academic.section) errs.section = "Section is required";
    }
    if (section === "parent") {
      if (!form.parent.guardianName.trim())
        errs.guardianName = "Guardian name is required";
      if (!form.parent.guardianPhone.trim())
        errs.guardianPhone = "Guardian phone is required";
    }
    return errs;
  };

  const sectionErrorCount = (section) => {
    return Object.keys(fieldErrors).filter(
      (f) => FIELD_SECTION[f] === section && fieldErrors[f],
    ).length;
  };

  const toggleSection = (key) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
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

  const handleFileUpload = (group, field) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const res = await uploadFile(file, "students");
      setForm((prev) => ({
        ...prev,
        [group]: { ...prev[group], [field]: res.data.url },
      }));
      showToast("File uploaded");
    } catch (err) {
      showToast(err.response?.data?.message || "File upload failed", "error");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const personalErrs = validateSection("personal");
    const academicErrs = validateSection("academic");
    const parentErrs = validateSection("parent");
    const allErrs = { ...personalErrs, ...academicErrs, ...parentErrs };

    setFieldErrors(allErrs);

    if (Object.keys(allErrs).length > 0) {
      const sectionsWithErrors = [
        ...new Set(Object.keys(allErrs).map((f) => FIELD_SECTION[f])),
      ];
      setOpenSections((prev) => [...new Set([...prev, ...sectionsWithErrors])]);
      showToast("Please fix the highlighted fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const documentsArray = Object.entries(form.documents)
        .filter(([, file]) => file)
        .map(([name, file]) => ({ name, file }));

      const payload = {
        ...form,
        personal: {
          ...form.personal,
          category: form.personal.category || null,
        },
        academic: {
          ...form.academic,
          house: form.academic.house || null,
        },
        documents: documentsArray,
      };

      if (isEdit) {
        await updateStudent(id, payload);
        showToast("Student updated successfully");
      } else {
        await createStudent(payload);
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
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">
            {isEdit ? "Edit Student" : "Create Student"}
          </h4>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setOpenSections(SECTIONS)}
            >
              Expand All
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setOpenSections([])}
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="card shadow-sm rounded-3">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <Accordion activeKey={openSections} alwaysOpen>
                {SECTIONS.map((section) => {
                  const errCount = sectionErrorCount(section);
                  return (
                    <Accordion.Item eventKey={section} key={section}>
                      <Accordion.Header
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSection(section);
                        }}
                      >
                        <span className="d-flex align-items-center gap-2 flex-grow-1">
                          {SECTION_LABELS[section]}
                          {errCount > 0 && (
                            <span className="badge bg-danger rounded-pill">
                              {errCount}
                            </span>
                          )}
                        </span>
                      </Accordion.Header>
                      <Accordion.Body>
                        {section === "personal" && (
                          <>
                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  First Name{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  className={`form-control ${fieldErrors.firstName ? "is-invalid" : ""}`}
                                  value={form.personal.firstName}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "firstName",
                                  )}
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
                                  Middle Name
                                </label>
                                <input
                                  className="form-control"
                                  value={form.personal.middleName}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "middleName",
                                  )}
                                  disabled={submitting}
                                />
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Last Name{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  className={`form-control ${fieldErrors.lastName ? "is-invalid" : ""}`}
                                  value={form.personal.lastName}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "lastName",
                                  )}
                                  disabled={submitting}
                                />
                                {fieldErrors.lastName && (
                                  <div className="invalid-feedback">
                                    {fieldErrors.lastName}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  DOB <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="date"
                                  className={`form-control ${fieldErrors.dob ? "is-invalid" : ""}`}
                                  value={form.personal.dob}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "dob",
                                  )}
                                  disabled={submitting}
                                />
                                {fieldErrors.dob && (
                                  <div className="invalid-feedback d-block">
                                    {fieldErrors.dob}
                                  </div>
                                )}
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Gender <span className="text-danger">*</span>
                                </label>
                                <select
                                  className={`form-select ${fieldErrors.gender ? "is-invalid" : ""}`}
                                  value={form.personal.gender}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "gender",
                                  )}
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
                                <label className="form-label">
                                  Birth Place
                                </label>
                                <input
                                  className="form-control"
                                  value={form.personal.birthPlace}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "birthPlace",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">Mobile</label>
                                <input
                                  className="form-control"
                                  value={form.personal.mobile}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "mobile",
                                  )}
                                  disabled={submitting}
                                />
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">Email</label>
                                <input
                                  className="form-control"
                                  value={form.personal.email}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "email",
                                  )}
                                  disabled={submitting}
                                />
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Aadhaar No.
                                </label>
                                <input
                                  className="form-control"
                                  value={form.personal.aadhaarNo}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "aadhaarNo",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">Religion</label>
                                <input
                                  className="form-control"
                                  value={form.personal.religion}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "religion",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">Category</label>
                                <select
                                  className="form-select"
                                  value={form.personal.category}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "category",
                                  )}
                                  disabled={submitting || loadingOptions}
                                >
                                  <option value="">Select Category</option>
                                  {allCategories.map((c) => (
                                    <option key={c._id} value={c._id}>
                                      {c.categoryName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">Caste Name</label>
                                <input
                                  className="form-control"
                                  value={form.personal.casteName}
                                  onChange={handleNestedChange(
                                    "personal",
                                    "casteName",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Mother Tongue
                                </label>
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
                            </div>
                          </>
                        )}

                        {section === "academic" && (
                          <>
                            <div className="row">
                              <div className="col-md-3 mb-3">
                                <label className="form-label">
                                  Admission No.{" "}
                                  <span className="text-danger">*</span>
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
                                <label className="form-label">
                                  Admission Date
                                </label>
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
                                  Academic Year{" "}
                                  <span className="text-danger">*</span>
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
                                <label className="form-label">
                                  Class <span className="text-danger">*</span>
                                </label>
                                <select
                                  className={`form-select ${fieldErrors.class ? "is-invalid" : ""}`}
                                  value={form.academic.class}
                                  onChange={handleNestedChange(
                                    "academic",
                                    "class",
                                  )}
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
                            </div>

                            <div className="row">
                              <div className="col-md-3 mb-3">
                                <label className="form-label">
                                  Section <span className="text-danger">*</span>
                                </label>
                                <select
                                  className={`form-select ${fieldErrors.section ? "is-invalid" : ""}`}
                                  value={form.academic.section}
                                  onChange={handleNestedChange(
                                    "academic",
                                    "section",
                                  )}
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
                                <label className="form-label">Roll No.</label>
                                <input
                                  className="form-control"
                                  value={form.academic.rollNo}
                                  onChange={handleNestedChange(
                                    "academic",
                                    "rollNo",
                                  )}
                                  disabled={submitting}
                                />
                              </div>

                              <div className="col-md-3 mb-3">
                                <label className="form-label">House</label>
                                <select
                                  className="form-select"
                                  value={form.academic.house}
                                  onChange={handleNestedChange(
                                    "academic",
                                    "house",
                                  )}
                                  disabled={submitting || loadingOptions}
                                >
                                  <option value="">Select House</option>
                                  {allHouses.map((h) => (
                                    <option key={h._id} value={h._id}>
                                      {h.houseName}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-md-3 mb-3">
                                <label className="form-label">
                                  Admission Type
                                </label>
                                <select
                                  className="form-select"
                                  value={form.academic.admissionType}
                                  onChange={handleNestedChange(
                                    "academic",
                                    "admissionType",
                                  )}
                                  disabled={submitting}
                                >
                                  <option value="New Admission">
                                    New Admission
                                  </option>
                                  <option value="Transfer">Transfer</option>
                                  <option value="Readmission">
                                    Readmission
                                  </option>
                                </select>
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-3 mb-3">
                                <label className="form-label">Status</label>
                                <select
                                  className="form-select"
                                  value={form.academic.status}
                                  onChange={handleNestedChange(
                                    "academic",
                                    "status",
                                  )}
                                  disabled={submitting}
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                  <option value="Transferred">
                                    Transferred
                                  </option>
                                  <option value="Graduated">Graduated</option>
                                </select>
                              </div>
                            </div>
                          </>
                        )}

                        {section === "parent" && (
                          <>
                            <h6 className="fw-bold mb-3">Father's Details</h6>
                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Father Name
                                </label>
                                <input
                                  className="form-control"
                                  value={form.parent.fatherName}
                                  onChange={handleNestedChange(
                                    "parent",
                                    "fatherName",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Father Phone
                                </label>
                                <input
                                  className="form-control"
                                  value={form.parent.fatherPhone}
                                  onChange={handleNestedChange(
                                    "parent",
                                    "fatherPhone",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Father Occupation
                                </label>
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
                            </div>

                            <h6 className="fw-bold mb-3">Mother's Details</h6>
                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Mother Name
                                </label>
                                <input
                                  className="form-control"
                                  value={form.parent.motherName}
                                  onChange={handleNestedChange(
                                    "parent",
                                    "motherName",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Mother Phone
                                </label>
                                <input
                                  className="form-control"
                                  value={form.parent.motherPhone}
                                  onChange={handleNestedChange(
                                    "parent",
                                    "motherPhone",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Mother Occupation
                                </label>
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
                            </div>

                            <hr />
                            <h6 className="fw-bold mb-3">Guardian Details</h6>
                            <div className="row">
                              <div className="col-md-3 mb-3">
                                <label className="form-label">
                                  If Guardian Is{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <select
                                  className="form-select"
                                  value={form.parent.guardianIs}
                                  onChange={handleNestedChange(
                                    "parent",
                                    "guardianIs",
                                  )}
                                  disabled={submitting}
                                >
                                  <option value="Father">Father</option>
                                  <option value="Mother">Mother</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div className="col-md-9 mb-3">
                                <label className="form-label">
                                  Guardian Name{" "}
                                  <span className="text-danger">*</span>
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
                            </div>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Guardian Relation
                                </label>
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

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Guardian Phone{" "}
                                  <span className="text-danger">*</span>
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

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Guardian Email
                                </label>
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
                            </div>

                            <div className="row">
                              <div className="col-md-4 mb-3">
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
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Annual Income
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={form.parent.annualIncome}
                                  onChange={handleNestedChange(
                                    "parent",
                                    "annualIncome",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Guardian Address
                                </label>
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
                          </>
                        )}

                        {section === "address" && (
                          <>
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
                                Same as Guardian Address
                              </label>
                            </div>

                            <div className="mb-4">
                              <label className="form-label">
                                Current Address
                              </label>
                              <textarea
                                className="form-control"
                                rows={2}
                                value={form.address.currentAddress}
                                onChange={handleNestedChange(
                                  "address",
                                  "currentAddress",
                                )}
                                disabled={
                                  submitting || form.address.sameAsGuardian
                                }
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
                                Same as Current Address
                              </label>
                            </div>

                            <div className="mb-3">
                              <label className="form-label">
                                Permanent Address
                              </label>
                              <textarea
                                className="form-control"
                                rows={2}
                                value={form.address.permanentAddress}
                                onChange={handleNestedChange(
                                  "address",
                                  "permanentAddress",
                                )}
                                disabled={
                                  submitting || form.address.sameAsCurrent
                                }
                              />
                            </div>
                          </>
                        )}

                        {section === "health" && (
                          <>
                            <div className="row">
                              <div className="col-md-3 mb-3">
                                <label className="form-label">
                                  Blood Group
                                </label>
                                <input
                                  className="form-control"
                                  placeholder="e.g. O+"
                                  value={form.health.bloodGroup}
                                  onChange={handleNestedChange(
                                    "health",
                                    "bloodGroup",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-3 mb-3">
                                <label className="form-label">
                                  Height (cm)
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={form.health.height}
                                  onChange={handleNestedChange(
                                    "health",
                                    "height",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-3 mb-3">
                                <label className="form-label">
                                  Weight (kg)
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={form.health.weight}
                                  onChange={handleNestedChange(
                                    "health",
                                    "weight",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label">Allergies</label>
                                <textarea
                                  className="form-control"
                                  rows={2}
                                  value={form.health.allergies}
                                  onChange={handleNestedChange(
                                    "health",
                                    "allergies",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="form-label">Disability</label>
                                <textarea
                                  className="form-control"
                                  rows={2}
                                  value={form.health.disability}
                                  onChange={handleNestedChange(
                                    "health",
                                    "disability",
                                  )}
                                  disabled={submitting}
                                />
                              </div>
                            </div>

                            <div className="mb-3">
                              <label className="form-label">
                                Medical History
                              </label>
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
                          </>
                        )}

                        {section === "documents" && (
                          <>
                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Student Photo
                                </label>
                                <input
                                  className="form-control"
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload(
                                    "personal",
                                    "photo",
                                  )}
                                  disabled={
                                    submitting || uploadingField === "photo"
                                  }
                                />
                                <div className="form-text">
                                  {uploadingField === "photo"
                                    ? "Uploading..."
                                    : "100px × 100px recommended."}
                                </div>
                                {form.personal.photo && (
                                  <img
                                    src={form.personal.photo}
                                    alt="Student"
                                    className="mt-2 rounded"
                                    style={{
                                      width: 60,
                                      height: 60,
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Father Photo
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="form-control"
                                  onChange={handlePhotoUpload(
                                    "parent",
                                    "fatherPhoto",
                                  )}
                                  disabled={
                                    submitting ||
                                    uploadingField === "fatherPhoto"
                                  }
                                />
                                {uploadingField === "fatherPhoto" && (
                                  <div className="form-text">Uploading...</div>
                                )}
                                {form.parent.fatherPhoto && (
                                  <img
                                    src={form.parent.fatherPhoto}
                                    alt="Father"
                                    className="mt-2 rounded"
                                    style={{
                                      width: 60,
                                      height: 60,
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Mother Photo
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="form-control"
                                  onChange={handlePhotoUpload(
                                    "parent",
                                    "motherPhoto",
                                  )}
                                  disabled={
                                    submitting ||
                                    uploadingField === "motherPhoto"
                                  }
                                />
                                {uploadingField === "motherPhoto" && (
                                  <div className="form-text">Uploading...</div>
                                )}
                                {form.parent.motherPhoto && (
                                  <img
                                    src={form.parent.motherPhoto}
                                    alt="Mother"
                                    className="mt-2 rounded"
                                    style={{
                                      width: 60,
                                      height: 60,
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Guardian Photo
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="form-control"
                                  onChange={handlePhotoUpload(
                                    "parent",
                                    "guardianPhoto",
                                  )}
                                  disabled={
                                    submitting ||
                                    uploadingField === "guardianPhoto"
                                  }
                                />
                                {uploadingField === "guardianPhoto" && (
                                  <div className="form-text">Uploading...</div>
                                )}
                                {form.parent.guardianPhoto && (
                                  <img
                                    src={form.parent.guardianPhoto}
                                    alt="Guardian"
                                    className="mt-2 rounded"
                                    style={{
                                      width: 60,
                                      height: 60,
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </div>
                            </div>

                            <hr />
                            <h6 className="fw-bold mb-3">Upload Documents</h6>
                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Birth Certificate
                                </label>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  className="form-control"
                                  onChange={handleFileUpload(
                                    "documents",
                                    "birthCertificate",
                                  )}
                                  disabled={
                                    submitting ||
                                    uploadingField === "birthCertificate"
                                  }
                                />
                                {uploadingField === "birthCertificate" && (
                                  <div className="form-text">Uploading...</div>
                                )}
                                {form.documents.birthCertificate && (
                                  <a
                                    href={form.documents.birthCertificate}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="form-text d-block"
                                  >
                                    View uploaded file
                                  </a>
                                )}
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Transfer Certificate
                                </label>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  className="form-control"
                                  onChange={handleFileUpload(
                                    "documents",
                                    "transferCertificate",
                                  )}
                                  disabled={
                                    submitting ||
                                    uploadingField === "transferCertificate"
                                  }
                                />
                                {uploadingField === "transferCertificate" && (
                                  <div className="form-text">Uploading...</div>
                                )}
                                {form.documents.transferCertificate && (
                                  <a
                                    href={form.documents.transferCertificate}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="form-text d-block"
                                  >
                                    View uploaded file
                                  </a>
                                )}
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">Aadhaar</label>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  className="form-control"
                                  onChange={handleFileUpload(
                                    "documents",
                                    "aadhaarDoc",
                                  )}
                                  disabled={
                                    submitting ||
                                    uploadingField === "aadhaarDoc"
                                  }
                                />
                                {uploadingField === "aadhaarDoc" && (
                                  <div className="form-text">Uploading...</div>
                                )}
                                {form.documents.aadhaarDoc && (
                                  <a
                                    href={form.documents.aadhaarDoc}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="form-text d-block"
                                  >
                                    View uploaded file
                                  </a>
                                )}
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">Marks Card</label>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  className="form-control"
                                  onChange={handleFileUpload(
                                    "documents",
                                    "marksCard",
                                  )}
                                  disabled={
                                    submitting || uploadingField === "marksCard"
                                  }
                                />
                                {uploadingField === "marksCard" && (
                                  <div className="form-text">Uploading...</div>
                                )}
                                {form.documents.marksCard && (
                                  <a
                                    href={form.documents.marksCard}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="form-text d-block"
                                  >
                                    View uploaded file
                                  </a>
                                )}
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">Others</label>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  className="form-control"
                                  onChange={handleFileUpload(
                                    "documents",
                                    "others",
                                  )}
                                  disabled={
                                    submitting || uploadingField === "others"
                                  }
                                />
                                {uploadingField === "others" && (
                                  <div className="form-text">Uploading...</div>
                                )}
                                {form.documents.others && (
                                  <a
                                    href={form.documents.others}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="form-text d-block"
                                  >
                                    View uploaded file
                                  </a>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                })}
              </Accordion>

              {/* --- Save / Cancel --- */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/students")}
                  disabled={submitting}
                >
                  Cancel
                </button>
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
