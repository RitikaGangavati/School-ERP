import { useEffect, useState, useCallback } from "react";

import AddIcon from "@mui/icons-material/Add";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import SearchBar from "../../components/common/SearchBar";
import RowActions from "../../components/common/RowActions";
import { useToast } from "../../context/ToastContext";

import {
  getHouses,
  createHouse,
  updateHouse,
  deleteHouse,
} from "../../services/houseService";

const emptyForm = {
  houseName: "",
  description: "",
  active: true,
};

export default function HouseList() {
  const { showToast } = useToast();

  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHouses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getHouses();
      setHouses(res.data.houses || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load houses. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  const filteredHouses = houses.filter(
    (house) =>
      house.houseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (house.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setNameError("");
  };

  const handleEditClick = (row) => {
    setForm({
      houseName: row.houseName,
      description: row.description || "",
      active: row.active,
    });

    setEditingId(row._id);
    setNameError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.houseName.trim()) {
      setNameError("House name is required");
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        await updateHouse(editingId, form);
        showToast("House updated successfully");
      } else {
        await createHouse(form);
        showToast("House created successfully");
      }

      resetForm();
      fetchHouses();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteHouse(deleteTarget._id);

      showToast("House deleted successfully");

      if (editingId === deleteTarget._id) {
        resetForm();
      }

      setDeleteTarget(null);
      fetchHouses();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Unable to delete house. Please try again.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      field: "houseName",
      headerName: "House Name",
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
                {editingId ? "Edit House" : "Create House"}
              </h6>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    House Name <span className="text-danger">*</span>
                  </label>

                  <input
                    className={`form-control ${
                      nameError ? "is-invalid" : ""
                    }`}
                    value={form.houseName}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        houseName: e.target.value,
                      }));

                      if (nameError) setNameError("");
                    }}
                    placeholder="e.g. Red House"
                    disabled={submitting}
                  />

                  {nameError && (
                    <div className="invalid-feedback">
                      {nameError}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Description
                  </label>

                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter description"
                    disabled={submitting}
                  />
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        active: e.target.checked,
                      }))
                    }
                    disabled={submitting}
                    id="houseActiveSwitch"
                  />

                  <label
                    className="form-check-label"
                    htmlFor="houseActiveSwitch"
                  >
                    {form.active ? "Active" : "Inactive"}
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary flex-grow-1"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                      ? "Update"
                      : "Save"}
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
                <h6 className="fw-bold mb-0">
                  House List
                </h6>

                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search houses..."
                />
              </div>

              {error && (
                <div className="alert alert-danger py-2">
                  {error}
                </div>
              )}

              <ResponsiveDataList
                columns={columns}
                rows={filteredHouses}
                loading={loading}
                minWidth={600}
                emptyMessage="No houses found. Use the form to create one."
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
        title="Delete House"
        message={`Are you sure you want to delete "${deleteTarget?.houseName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}