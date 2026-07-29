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
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../services/roleService";

const emptyForm = { roleName: "", description: "", active: true };

export default function RoleList() {
  const { showToast } = useToast();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getRoles();
      setRoles(res.data.roles || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load roles. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = roles.filter(
    (role) =>
      role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNameError("");
  };

  const handleEditClick = (row) => {
    setForm({
      roleName: row.roleName,
      description: row.description || "",
      active: row.active,
    });
    setEditingId(row._id);
    setNameError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.roleName.trim()) {
      setNameError("Role name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateRole(editingId, form);
        showToast("Role updated successfully");
      } else {
        await createRole(form);
        showToast("Role created successfully");
      }
      resetForm();
      fetchRoles();
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
      await deleteRole(deleteTarget._id);
      showToast("Role deleted successfully");
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      fetchRoles();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete role. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: "roleName", headerName: "Role Name" },
    { field: "description", headerName: "Description", muted: true },
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
                {editingId ? "Edit Role" : "Create Role"}
              </h6>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Role Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${nameError ? "is-invalid" : ""}`}
                    value={form.roleName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, roleName: e.target.value }));
                      if (nameError) setNameError("");
                    }}
                    placeholder="e.g. Admin, Teacher"
                    disabled={submitting}
                  />
                  {nameError && <div className="invalid-feedback">{nameError}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
                    id="roleActiveSwitch"
                  />
                  <label className="form-check-label" htmlFor="roleActiveSwitch">
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
                <h6 className="fw-bold mb-0">Role List</h6>
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search roles..."
                />
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <ResponsiveDataList
                columns={columns}
                rows={filteredRoles}
                loading={loading}
                minWidth={600}
                emptyMessage="No roles found. Use the form to create one."
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
        title="Delete Role"
        message={`Are you sure you want to delete "${deleteTarget?.roleName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}