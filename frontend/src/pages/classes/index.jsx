import { useEffect, useState, useCallback } from "react";

import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import SearchBar from "../../components/common/SearchBar";
import { useToast } from "../../components/common/ToastContext";
import RowActions from "../../components/common/RowActions";
import { getSections } from "../../services/sectionService";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../../services/classService";

const emptyForm = { className: "", sections: [], active: true };

export default function ClassList() {
  const { showToast } = useToast();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [allSections, setAllSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getClasses();
      setClasses(res.data.classes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load classes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      const res = await getSections();
      setAllSections(res.data.sections || []);
    } catch (err) {
      setAllSections([]);
    } finally {
      setLoadingSections(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchSections();
  }, [fetchClasses, fetchSections]);

  const filteredClasses = classes.filter((c) =>
    c.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNameError("");
  };

  const handleEditClick = (row) => {
    setForm({
      className: row.className,
      sections: row.sections?.map((s) => s._id) || [],
      active: row.active,
    });
    setEditingId(row._id);
    setNameError("");
  };

  const toggleSection = (id) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.includes(id)
        ? f.sections.filter((s) => s !== id)
        : [...f.sections, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.className.trim()) {
      setNameError("Class name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateClass(editingId, form);
        showToast("Class updated successfully");
      } else {
        await createClass(form);
        showToast("Class created successfully");
      }
      resetForm();
      fetchClasses();
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
      await deleteClass(deleteTarget._id);
      showToast("Class deleted successfully");
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      fetchClasses();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete class. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: "className", headerName: "Class Name" },
    {
      field: "sections",
      headerName: "Sections",
      render: (row) =>
        row.sections && row.sections.length > 0
          ? row.sections.map((s) => s.sectionName).join(", ")
          : "—",
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
        {/* Left: Create/Edit form */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm rounded-3 h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-1">
                <AddIcon fontSize="small" />
                {editingId ? "Edit Class" : "Create Class"}
              </h6>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Class Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    value={form.className}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, className: e.target.value }));
                      if (nameError) setNameError("");
                    }}
                    placeholder="e.g. 1st Class, 10th Grade"
                    disabled={submitting}
                  />
                  {nameError && <div className="invalid-feedback">{nameError}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Sections</label>

                  {loadingSections ? (
                    <div className="text-muted small">Loading sections...</div>
                  ) : allSections.length === 0 ? (
                    <div className="text-muted small">
                      No sections found. Create sections first in Section Master.
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {allSections.map((sec) => {
                        const isChecked = form.sections.includes(sec._id);
                        return (
                          <div
                            key={sec._id}
                            onClick={() => !submitting && toggleSection(sec._id)}
                            className={`px-3 py-1 rounded-pill border ${
                              isChecked
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-dark"
                            }`}
                            style={{ cursor: submitting ? "default" : "pointer", userSelect: "none" }}
                          >
                            {sec.sectionName}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    disabled={submitting}
                    id="classActiveSwitch"
                  />
                  <label className="form-check-label" htmlFor="classActiveSwitch">
                    {form.active ? "Active" : "Inactive"}
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={submitting}>
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

        {/* Right: List */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm rounded-3">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h6 className="fw-bold mb-0">Class List</h6>
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search classes..."
                />
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <ResponsiveDataList
                columns={columns}
                rows={filteredClasses}
                loading={loading}
                minWidth={600}
                emptyMessage="No classes found. Use the form to create one."
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
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteTarget?.className}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}