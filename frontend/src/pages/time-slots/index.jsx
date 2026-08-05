import { useEffect, useState, useCallback } from "react";

import AddIcon from "@mui/icons-material/Add";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import SearchBar from "../../components/common/SearchBar";
import RowActions from "../../components/common/RowActions";
import { useToast } from "../../components/common/ToastContext";

import {
  getTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
} from "../../services/timeSlotService";

const emptyForm = {
  periodName: "",
  startTime: "",
  endTime: "",
  type: "Period",
  displayOrder: "",
  active: true,
};

export default function TimeSlots() {
  const { showToast } = useToast();

  const [timeSlots, setTimeSlots] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [errors, setErrors] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const fetchTimeSlots = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getTimeSlots();

      setTimeSlots(res.data.timeSlots || []);
    } catch (err) {
      showToast("Failed to load Time Slots", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const validate = () => {
    const err = {};

    if (!form.periodName.trim()) err.periodName = "Period Name is required";

    if (!form.startTime) err.startTime = "Start Time is required";

    if (!form.endTime) err.endTime = "End Time is required";

    if (!form.displayOrder) err.displayOrder = "Display Order is required";

    if (form.startTime >= form.endTime)
      err.endTime = "End Time must be greater than Start Time";

    setErrors(err);

    return Object.keys(err).length === 0;
  };

  const resetForm = () => {
    setForm(emptyForm);

    setEditingId(null);

    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      if (editingId) {
        await updateTimeSlot(editingId, form);

        showToast("Time Slot updated successfully");
      } else {
        await createTimeSlot(form);

        showToast("Time Slot created successfully");
      }

      fetchTimeSlots();

      resetForm();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row._id);

    setForm({
      periodName: row.periodName,
      startTime: row.startTime,
      endTime: row.endTime,
      type: row.type,
      displayOrder: row.displayOrder,
      active: row.active,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteTimeSlot(deleteTarget._id);

      showToast("Time Slot deleted");

      fetchTimeSlots();

      setDeleteTarget(null);

      if (editingId === deleteTarget._id) {
        resetForm();
      }
    } catch (err) {
      showToast("Unable to delete", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRows = timeSlots.filter((row) =>
    row.periodName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    {
      field: "periodName",
      headerName: "Period",
      render: (row) => row.periodName,
    },
    {
      field: "startTime",
      headerName: "Start",
      render: (row) => row.startTime,
    },
    {
      field: "endTime",
      headerName: "End",
      render: (row) => row.endTime,
    },
    {
      field: "type",
      headerName: "Type",
      render: (row) => row.type,
    },
    {
      field: "displayOrder",
      headerName: "Order",
      render: (row) => row.displayOrder,
    },
    {
      field: "active",
      headerName: "Status",
      render: (row) => <StatusChip active={row.active} />,
    },
  ];
  return (
    <MainLayout>
      <div className="row g-4">
        {/* Form */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white">
              <h5 className="mb-0 d-flex align-items-center">
                <AddIcon className="me-2" />
                {editingId ? "Edit Time Slot" : "Add Time Slot"}
              </h5>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Period Name */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Period Name <span className="text-danger">*</span>
                  </label>

                  <input
                    type="text"
                    className={`form-control ${
                      errors.periodName ? "is-invalid" : ""
                    }`}
                    placeholder="Ex : Period 1"
                    value={form.periodName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        periodName: e.target.value,
                      })
                    }
                  />

                  {errors.periodName && (
                    <div className="invalid-feedback">{errors.periodName}</div>
                  )}
                </div>

                {/* Start Time */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Start Time <span className="text-danger">*</span>
                  </label>

                  <input
                    type="time"
                    className={`form-control ${
                      errors.startTime ? "is-invalid" : ""
                    }`}
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startTime: e.target.value,
                      })
                    }
                  />

                  {errors.startTime && (
                    <div className="invalid-feedback">{errors.startTime}</div>
                  )}
                </div>

                {/* End Time */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    End Time <span className="text-danger">*</span>
                  </label>

                  <input
                    type="time"
                    className={`form-control ${
                      errors.endTime ? "is-invalid" : ""
                    }`}
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endTime: e.target.value,
                      })
                    }
                  />

                  {errors.endTime && (
                    <div className="invalid-feedback">{errors.endTime}</div>
                  )}
                </div>

                {/* Type */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Type</label>

                  <select
                    className="form-select"
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="Period">Period</option>
                    <option value="Break">Break</option>
                    <option value="Lunch">Lunch</option>
                  </select>
                </div>

                {/* Display Order */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Display Order <span className="text-danger">*</span>
                  </label>

                  <input
                    type="number"
                    min="1"
                    className={`form-control ${
                      errors.displayOrder ? "is-invalid" : ""
                    }`}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        displayOrder: e.target.value,
                      })
                    }
                  />

                  {errors.displayOrder && (
                    <div className="invalid-feedback">
                      {errors.displayOrder}
                    </div>
                  )}
                </div>

                {/* Active */}
                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        active: e.target.checked,
                      })
                    }
                  />

                  <label className="form-check-label">
                    {form.active ? "Active" : "Inactive"}
                  </label>
                </div>

                {/* Buttons */}
                <div className="d-grid gap-2 d-md-flex">
                  <button
                    className="btn btn-primary flex-fill"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : editingId ? "Update" : "Save"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Time Slots</h5>

              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search Time Slot..."
              />
            </div>

            <div className="card-body">
              <ResponsiveDataList
                columns={columns}
                rows={filteredRows}
                loading={loading}
                minWidth={700}
                emptyMessage="No Time Slots Found"
                renderActions={(row) => (
                  <RowActions
                    onEdit={() => handleEdit(row)}
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
        title="Delete Time Slot"
        message={`Are you sure you want to delete "${deleteTarget?.periodName}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}
