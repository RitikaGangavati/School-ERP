import { useEffect, useState, useCallback } from "react";

import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import SearchBar from "../../components/common/SearchBar";
import RowActions from "../../components/common/RowActions";
import { useToast } from "../../context/ToastContext";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../services/subjectService";

const emptyForm = { subjectName: "", subjectCode: "", subjectType: "", active: true };

export default function SubjectList() {
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSubjects();
      setSubjects(res.data.subjects || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load subjects. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.subjectCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.subjectType || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNameError("");
  };

  const handleEditClick = (row) => {
    setForm({
      subjectName: row.subjectName,
      subjectCode: row.subjectCode || "",
      subjectType: row.subjectType || "",
      active: row.active,
    });
    setEditingId(row._id);
    setNameError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subjectName.trim()) {
      setNameError("Subject name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateSubject(editingId, form);
        showToast("Subject updated successfully");
      } else {
        await createSubject(form);
        showToast("Subject created successfully");
      }
      resetForm();
      fetchSubjects();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubject(deleteTarget._id);
      showToast("Subject deleted successfully");
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete subject. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: "subjectName", headerName: "Subject Name" },
    { field: "subjectCode", headerName: "Code", muted: true },
    { field: "subjectType", headerName: "Type", muted: true },
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
                {editingId ? "Edit Subject" : "Create Subject"}
              </h6>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Subject Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    value={form.subjectName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, subjectName: e.target.value }));
                      if (nameError) setNameError("");
                    }}
                    placeholder="e.g. Mathematics"
                    disabled={submitting}
                  />
                  {nameError && <div className="invalid-feedback">{nameError}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Subject Code</label>
                  <input
                    className="form-control"
                    value={form.subjectCode}
                    onChange={(e) => setForm((f) => ({ ...f, subjectCode: e.target.value }))}
                    placeholder="e.g. MATH101"
                    disabled={submitting}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Subject Type</label>
                  <input
                    className="form-control"
                    value={form.subjectType}
                    onChange={(e) => setForm((f) => ({ ...f, subjectType: e.target.value }))}
                    placeholder="e.g. Theory, Practical, Core, Elective"
                    disabled={submitting}
                  />
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    disabled={submitting}
                    id="subjectActiveSwitch"
                  />
                  <label className="form-check-label" htmlFor="subjectActiveSwitch">
                    {form.active ? "Active" : "Inactive"}
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={submitting}>
                    {submitting ? "Saving..." : editingId ? "Update" : "Save"}
                  </button>
                  {editingId && (
                    <button type="button" className="btn btn-light" onClick={resetForm} disabled={submitting}>
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
                <h6 className="fw-bold mb-0">Subject List</h6>
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search subjects..."
                />
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <ResponsiveDataList
                columns={columns}
                rows={filteredSubjects}
                loading={loading}
                minWidth={600}
                emptyMessage="No subjects found. Use the form to create one."
                renderActions={(row) => (
                  <RowActions onEdit={() => handleEditClick(row)} onDelete={() => setDeleteTarget(row)} />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.subjectName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}