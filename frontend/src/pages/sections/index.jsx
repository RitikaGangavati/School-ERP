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
import { useToast } from "../../components/common/ToastContext";
import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
} from "../../services/sectionService";

const emptyForm = { sectionName: "", active: true };

export default function SectionList() {
  const { showToast } = useToast();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSections();
      setSections(res.data.sections || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load sections. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const filteredSections = sections.filter((s) =>
    s.sectionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNameError("");
  };

  const handleEditClick = (row) => {
    setForm({ sectionName: row.sectionName, active: row.active });
    setEditingId(row._id);
    setNameError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.sectionName.trim()) {
      setNameError("Section name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateSection(editingId, form);
        showToast("Section updated successfully");
      } else {
        await createSection(form);
        showToast("Section created successfully");
      }
      resetForm();
      fetchSections();
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
      await deleteSection(deleteTarget._id);
      showToast("Section deleted successfully");
      if (editingId === deleteTarget._id) resetForm(); // clear form if deleting the one being edited
      setDeleteTarget(null);
      fetchSections();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete section. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: "sectionName", headerName: "Section Name" },
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
                {editingId ? "Edit Section" : "Create Section"}
              </h6>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Section Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    value={form.sectionName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, sectionName: e.target.value }));
                      if (nameError) setNameError("");
                    }}
                    placeholder="e.g. A, B, C"
                    disabled={submitting}
                  />
                  {nameError && <div className="invalid-feedback">{nameError}</div>}
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    disabled={submitting}
                    id="sectionActiveSwitch"
                  />
                  <label className="form-check-label" htmlFor="sectionActiveSwitch">
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
                <h6 className="fw-bold mb-0">Section List</h6>
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search sections..."
                />
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <ResponsiveDataList
                columns={columns}
                rows={filteredSections}
                loading={loading}
                minWidth={400}
                emptyMessage="No sections found. Use the form to create one."
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
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteTarget?.sectionName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}