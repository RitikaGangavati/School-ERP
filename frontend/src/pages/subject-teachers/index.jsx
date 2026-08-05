import { useEffect, useState, useCallback } from "react";

import AddIcon from "@mui/icons-material/Add";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SearchBar from "../../components/common/SearchBar";
import RowActions from "../../components/common/RowActions";
import { useToast } from "../../components/common/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

import AcademicYearBadge from "../../components/common/AcademicYearBadge";
import { getClasses } from "../../services/classService";
import { getSubjects } from "../../services/subjectService";
import { getTeachers } from "../../services/teacherService";
import {
  getSubjectTeachers,
  createSubjectTeacher,
  updateSubjectTeacher,
  deleteSubjectTeacher,
} from "../../services/subjectTeacherService";

const emptyForm = {
  class: "",
  section: "",
  subject: "",
  teacher: "",
};

export default function SubjectTeacher() {

  const { showToast } = useToast();
  const { currentYear } = useAcademicYear();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [allYears, setAllYears] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubjectTeachers();
      setAssignments(res.data.subjectTeachers || []);
    } catch (err) {
      showToast("Failed to load assignments", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [classRes, subjectRes, teacherRes] = await Promise.all([
        getClasses(),
        getSubjects(),
        getTeachers(),
      ]);
      setAllClasses(classRes.data.classes || []);
      setAllSubjects(subjectRes.data.subjects || []);
      setAllTeachers(teacherRes.data.teachers || []);
    } catch (err) {
      showToast("Failed to load form options", "error");
    } finally {
      setLoadingOptions(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAssignments();
    fetchOptions();
  }, [fetchAssignments, fetchOptions]);

  const selectedClassObj = allClasses.find((c) => c._id === form.class);
  const availableSections = selectedClassObj?.sections || [];

  // Teacher dropdown filtered to only those qualified for the selected subject
  const eligibleTeachers = form.subject
    ? allTeachers.filter((t) =>
        t.subjects?.some((s) => (s._id || s) === form.subject),
      )
    : allTeachers;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const handleEditClick = (row) => {
    setForm({
      class: row.class?._id || "",
      section: row.section?._id || "",
      subject: row.subject?._id || "",
      teacher: row.teacher?._id || "",
    });
    setEditingId(row._id);
    setErrors({});
  };

  const handleClassChange = (classId) => {
    setForm((f) => ({ ...f, class: classId, section: "" }));
  };

  const handleSubjectChange = (subjectId) => {
    // Changing subject may invalidate the currently picked teacher, so clear it
    setForm((f) => ({ ...f, subject: subjectId, teacher: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.class) errs.class = "Class is required";
    if (!form.section) errs.section = "Section is required";
    if (!form.subject) errs.subject = "Subject is required";
    if (!form.teacher) errs.teacher = "Teacher is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!currentYear) {
    showToast(
      "No current academic year set. Set one in Academic Year master first.",
      "error",
    );
    return;
  }
  if (!validate()) return;

  setSubmitting(true);
  try {
    const payload = { ...form, academicYear: currentYear._id };
    if (editingId) {
      await updateSubjectTeacher(editingId, payload);
      showToast("Assignment updated successfully");
    } else {
      await createSubjectTeacher(payload);
      showToast("Teacher assigned successfully");
    }
    resetForm();
    fetchAssignments();
  } catch (err) {
    showToast(err.response?.data?.message || "Something went wrong", "error");
  } finally {
    setSubmitting(false);
  }
};

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubjectTeacher(deleteTarget._id);
      showToast("Assignment removed successfully");
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      fetchAssignments();
    } catch (err) {
      showToast("Unable to remove assignment", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRows = assignments.filter((row) => {
    const term = searchTerm.toLowerCase();
    return (
      row.teacher?.firstName?.toLowerCase().includes(term) ||
      row.teacher?.lastName?.toLowerCase().includes(term) ||
      row.subject?.subjectName?.toLowerCase().includes(term) ||
      row.class?.className?.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
    field: "academicYear",
    headerName: "Year",
    render: (row) => row.academicYear?.name || "—",
  },
    {
      field: "class",
      headerName: "Class",
      render: (row) => row.class?.className || "—",
    },
    {
      field: "section",
      headerName: "Section",
      render: (row) => row.section?.sectionName || "—",
    },
    {
      field: "subject",
      headerName: "Subject",
      render: (row) => row.subject?.subjectName || "—",
    },
    {
      field: "teacher",
      headerName: "Teacher",
      render: (row) =>
        row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : "—",
    },
  ];

  return (
    <MainLayout>
      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm rounded-3 h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-1">
                <AddIcon fontSize="small" />
                {editingId ? "Edit Assignment" : "Assign Subject Teacher"}
              </h6>

               <AcademicYearBadge/>


              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label">
                    Class <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.class ? "is-invalid" : ""}`}
                    value={form.class}
                    onChange={(e) => handleClassChange(e.target.value)}
                    disabled={submitting || loadingOptions}
                  >
                    <option value="">Select Class</option>
                    {allClasses.map((c) => (
                      <option key={c._id} value={c._id}>{c.className}</option>
                    ))}
                  </select>
                  {errors.class && (
                    <div className="invalid-feedback d-block">{errors.class}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Section <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.section ? "is-invalid" : ""}`}
                    value={form.section}
                    onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                    disabled={submitting || !form.class}
                  >
                    <option value="">
                      {form.class ? "Select Section" : "Select class first"}
                    </option>
                    {availableSections.map((s) => (
                      <option key={s._id} value={s._id}>{s.sectionName}</option>
                    ))}
                  </select>
                  {errors.section && (
                    <div className="invalid-feedback d-block">{errors.section}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Subject <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.subject ? "is-invalid" : ""}`}
                    value={form.subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    disabled={submitting || loadingOptions}
                  >
                    <option value="">Select Subject</option>
                    {allSubjects.map((s) => (
                      <option key={s._id} value={s._id}>{s.subjectName}</option>
                    ))}
                  </select>
                  {errors.subject && (
                    <div className="invalid-feedback d-block">{errors.subject}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Teacher <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.teacher ? "is-invalid" : ""}`}
                    value={form.teacher}
                    onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}
                    disabled={submitting || !form.subject}
                  >
                    <option value="">
                      {form.subject ? "Select Teacher" : "Select subject first"}
                    </option>
                    {eligibleTeachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.firstName} {t.lastName}
                      </option>
                    ))}
                  </select>
                  {form.subject && eligibleTeachers.length === 0 && (
                    <div className="form-text text-warning">
                      No teacher is registered for this subject. Update the teacher's profile first.
                    </div>
                  )}
                  {errors.teacher && (
                    <div className="invalid-feedback d-block">{errors.teacher}</div>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={submitting}>
                    {submitting ? "Saving..." : editingId ? "Update" : "Assign"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card shadow-sm rounded-3">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h6 className="fw-bold mb-0">Subject Teacher Assignments</h6>
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search teacher, subject, class..."
                />
              </div>

              <ResponsiveDataList
                columns={columns}
                rows={filteredRows}
                loading={loading}
                minWidth={800}
                emptyMessage="No assignments found. Use the form to assign one."
                renderActions={(row) => (
                  <RowActions
                    onEdit={() => handleEditClick(row)}
                    onDelete={() => setDeleteTarget(row)}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Assignment"
        message={`Remove ${deleteTarget?.teacher?.firstName || "this"} from ${deleteTarget?.subject?.subjectName || "this subject"}?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}