import { useEffect, useState, useCallback } from "react";

import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import SearchBar from "../../components/common/SearchBar";
import PillList from "../../components/common/PillList";
import { useToast } from "../../components/common/ToastContext";
import { getClasses } from "../../services/classService";
import RowActions from "../../components/common/RowActions";
import { getSubjects } from "../../services/subjectService";
import { getAcademicYears } from "../../services/academicYearService";
import {
  getSubjectGroups,
  createSubjectGroup,
  updateSubjectGroup,
  deleteSubjectGroup,
} from "../../services/subjectGroupService";

const emptyForm = {
  academicYear: "",
  groupName: "",
  class: "",
  sections: [],
  subjects: [],
  description: "",
  active: true,
};

export default function SubjectGroupList() {
  const { showToast } = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSubjectGroups();
      setGroups(res.data.subjectGroups || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load subject groups. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [classRes, subjectRes, academicRes] = await Promise.all([
        getClasses(),
        getSubjects(),
        getAcademicYears(),
      ]);
      setAllClasses(classRes.data.classes || []);
      setAllSubjects(subjectRes.data.subjects || []);
      setAcademicYears(academicRes.data.academicYears || []);
    } catch (err) {
      setAllClasses([]);
      setAllSubjects([]);
      setAcademicYears([]);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchOptions();
  }, [fetchGroups, fetchOptions]);

  const filteredGroups = groups.filter((g) =>
    g.groupName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Sections available depend entirely on the selected class
  const selectedClassObj = allClasses.find((c) => c._id === form.class);
  const availableSections = selectedClassObj?.sections || [];

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNameError({});
  };

  const handleEditClick = (row) => {
    setForm({
      academicYear: row.academicYear?._id || "",
      groupName: row.groupName,
      class: row.class?._id || "",
      sections: row.sections?.map((s) => s._id) || [],
      subjects: row.subjects?.map((s) => s._id) || [],
      description: row.description || "",
      active: row.active,
    });
    setEditingId(row._id);
    setNameError({});
  };

  const handleClassChange = (classId) => {
    // Changing class resets section selection, since sections are class-specific
    setForm((f) => ({ ...f, class: classId, sections: [] }));
    if (nameError.class) setNameError((e) => ({ ...e, class: "" }));
  };

  const toggleSection = (id) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.includes(id)
        ? f.sections.filter((s) => s !== id)
        : [...f.sections, id],
    }));
  };

  const toggleSubject = (id) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(id)
        ? f.subjects.filter((s) => s !== id)
        : [...f.subjects, id],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.academicYear) errs.academicYear = "Academic Year is required";
    if (!form.groupName.trim()) errs.groupName = "Group name is required";
    if (!form.class) errs.class = "Class is required";
    if (form.sections.length === 0)
      errs.sections = "Select at least one section";
    if (form.subjects.length === 0)
      errs.subjects = "Select at least one subject";
    setNameError(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateSubjectGroup(editingId, form);
        showToast("Subject group updated successfully");
      } else {
        await createSubjectGroup(form);
        showToast("Subject group created successfully");
      }
      resetForm();
      fetchGroups();
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubjectGroup(deleteTarget._id);
      showToast("Subject group deleted successfully");
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      fetchGroups();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Unable to delete subject group. Please try again.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      field: "academicYear",
      headerName: "Academic Year",
      render: (row) => row.academicYear?.name || "—",
    },
    { field: "groupName", headerName: "Group Name" },
    {
      field: "class",
      headerName: "Class",
      render: (row) =>
        row.class?.className ? (
          <span
            className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle fw-normal"
            style={{ fontSize: "0.75rem" }}
          >
            {row.class.className}
          </span>
        ) : (
          "—"
        ),
    },
    {
      field: "sections",
      headerName: `Sections`,
      render: (row) => (
        <PillList
          items={row.sections?.map((s) => s.sectionName) || []}
          variant="primary"
        />
      ),
    },
    {
      field: "subjects",
      headerName: "Subjects",
      render: (row) => (
        <PillList items={row.subjects?.map((s) => s.subjectName) || []} />
      ),
    },
    {
      field: "description",
      headerName: "Description",
      muted: true,
    },
    {
      field: "active",
      headerName: "Status",
      render: (row) => <StatusChip active={row.active} />,
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
                {editingId ? "Edit Subject Group" : "Add Subject Group"}
              </h6>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Academic Year <span className="text-danger">*</span>
                  </label>

                  <select
                    className={`form-select ${
                      nameError.academicYear ? "is-invalid" : ""
                    }`}
                    value={form.academicYear}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        academicYear: e.target.value,
                      }))
                    }
                    disabled={submitting || loadingOptions}
                  >
                    <option value="">Select Academic Year</option>

                    {academicYears.map((year) => (
                      <option key={year._id} value={year._id}>
                        {year.name}
                      </option>
                    ))}
                  </select>

                  {nameError.academicYear && (
                    <div className="invalid-feedback d-block">
                      {nameError.academicYear}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${nameError.groupName ? "is-invalid" : ""}`}
                    value={form.groupName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, groupName: e.target.value }));
                      if (nameError.groupName)
                        setNameError((err) => ({ ...err, groupName: "" }));
                    }}
                    placeholder="e.g. Science Group"
                    disabled={submitting}
                  />
                  {nameError.groupName && (
                    <div className="invalid-feedback">
                      {nameError.groupName}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Class <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${nameError.class ? "is-invalid" : ""}`}
                    value={form.class}
                    onChange={(e) => handleClassChange(e.target.value)}
                    disabled={submitting || loadingOptions}
                  >
                    <option value="">Select Class</option>
                    {allClasses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                  {nameError.class && (
                    <div className="invalid-feedback d-block">
                      {nameError.class}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Sections <span className="text-danger">*</span>
                  </label>

                  {!form.class ? (
                    <div className="text-muted small">Select a class first</div>
                  ) : availableSections.length === 0 ? (
                    <div className="text-muted small">
                      This class has no sections assigned
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {availableSections.map((sec) => {
                        const isChecked = form.sections.includes(sec._id);
                        return (
                          <div
                            key={sec._id}
                            onClick={() =>
                              !submitting && toggleSection(sec._id)
                            }
                            className={`px-3 py-1 rounded-pill border ${
                              isChecked
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-dark"
                            }`}
                            style={{
                              cursor: submitting ? "default" : "pointer",
                              userSelect: "none",
                            }}
                          >
                            {sec.sectionName}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {nameError.sections && (
                    <div className="text-danger small mt-1">
                      {nameError.sections}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Subject <span className="text-danger">*</span>
                  </label>

                  {loadingOptions ? (
                    <div className="text-muted small">Loading subjects...</div>
                  ) : allSubjects.length === 0 ? (
                    <div className="text-muted small">
                      No subjects found. Create subjects first in Subject
                      Master.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-1">
                      {allSubjects.map((sub) => {
                        const isChecked = form.subjects.includes(sub._id);
                        return (
                          <div className="form-check" key={sub._id}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSubject(sub._id)}
                              disabled={submitting}
                              id={`subject-${sub._id}`}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`subject-${sub._id}`}
                            >
                              {sub.subjectName}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {nameError.subjects && (
                    <div className="text-danger small mt-1">
                      {nameError.subjects}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    disabled={submitting}
                  />
                </div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="subjectGroupActiveSwitch"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, active: e.target.checked }))
                    }
                    disabled={submitting}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="subjectGroupActiveSwitch"
                  >
                    {form.active ? "Active" : "Inactive"}
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : editingId ? "Update" : "Save"}
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
                <h6 className="fw-bold mb-0">Subject Group List</h6>
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search groups..."
                />
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <ResponsiveDataList
                columns={columns}
                rows={filteredGroups}
                loading={loading}
                minWidth={900}
                emptyMessage="No subject groups found. Use the form to create one."
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
        title="Delete Subject Group"
        message={`Are you sure you want to delete "${deleteTarget?.groupName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}
