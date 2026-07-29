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
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
} from "../../services/academicYearService";

const emptyForm = { name: "", startDate: "", endDate: "", isCurrent: false, active: true };

// Helper to format ISO date string -> yyyy-mm-dd for <input type="date">
const toDateInput = (isoString) => (isoString ? isoString.slice(0, 10) : "");

export default function AcademicYearList() {
  const { showToast } = useToast();

  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchYears = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAcademicYears();
      setYears(res.data.academicYears || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load academic years. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const filteredYears = years.filter((y) =>
    y.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  };

  const handleEditClick = (row) => {
    setForm({
      name: row.name,
      startDate: toDateInput(row.startDate),
      endDate: toDateInput(row.endDate),
      isCurrent: row.isCurrent,
      active: row.active,
    });
    setEditingId(row._id);
    setFieldErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      errs.endDate = "End date must be after start date";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateAcademicYear(editingId, form);
        showToast("Academic year updated successfully");
      } else {
        await createAcademicYear(form);
        showToast("Academic year created successfully");
      }
      resetForm();
      fetchYears();
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
      await deleteAcademicYear(deleteTarget._id);
      showToast("Academic year deleted successfully");
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      fetchYears();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete academic year. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: "name", headerName: "Academic Year" },
    {
      field: "startDate",
      headerName: "Start Date",
      muted: true,
      render: (row) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      field: "endDate",
      headerName: "End Date",
      muted: true,
      render: (row) => new Date(row.endDate).toLocaleDateString(),
    },
    {
      field: "isCurrent",
      headerName: "Current",
      render: (row) =>
        row.isCurrent ? <span className="badge bg-primary">Current</span> : "—",
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
                {editingId ? "Edit Academic Year" : "Create Academic Year"}
              </h6>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      if (fieldErrors.name) setFieldErrors((er) => ({ ...er, name: "" }));
                    }}
                    placeholder="e.g. 2025-2026"
                    disabled={submitting}
                  />
                  {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Start Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${fieldErrors.startDate ? "is-invalid" : ""}`}
                    value={form.startDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, startDate: e.target.value }));
                      if (fieldErrors.startDate) setFieldErrors((er) => ({ ...er, startDate: "" }));
                    }}
                    disabled={submitting}
                  />
                  {fieldErrors.startDate && <div className="invalid-feedback d-block">{fieldErrors.startDate}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    End Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${fieldErrors.endDate ? "is-invalid" : ""}`}
                    value={form.endDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, endDate: e.target.value }));
                      if (fieldErrors.endDate) setFieldErrors((er) => ({ ...er, endDate: "" }));
                    }}
                    disabled={submitting}
                  />
                  {fieldErrors.endDate && <div className="invalid-feedback d-block">{fieldErrors.endDate}</div>}
                </div>

                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.isCurrent}
                    onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked }))}
                    disabled={submitting}
                    id="isCurrentSwitch"
                  />
                  <label className="form-check-label" htmlFor="isCurrentSwitch">
                    Set as current academic year
                  </label>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    disabled={submitting}
                    id="yearActiveSwitch"
                  />
                  <label className="form-check-label" htmlFor="yearActiveSwitch">
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
                <h6 className="fw-bold mb-0">Academic Year List</h6>
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search academic years..." />
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <ResponsiveDataList
                columns={columns}
                rows={filteredYears}
                loading={loading}
                minWidth={700}
                emptyMessage="No academic years found. Use the form to create one."
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
        title="Delete Academic Year"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}