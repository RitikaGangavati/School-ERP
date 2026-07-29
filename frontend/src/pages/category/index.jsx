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
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";

const emptyForm = {
  categoryName: "",
  categoryCode: "",
  description: "",
  active: true,
};

export default function CategoryList() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getCategories();
      setCategories(res.data.categories || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load categories. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = categories.filter(
    (c) =>
      c.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.categoryCode || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (c.description || "")
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
      categoryName: row.categoryName,
      categoryCode: row.categoryCode || "",
      description: row.description || "",
      active: row.active,
    });

    setEditingId(row._id);
    setNameError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.categoryName.trim()) {
      setNameError("Category name is required");
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        await updateCategory(editingId, form);
        showToast("Category updated successfully");
      } else {
        await createCategory(form);
        showToast("Category created successfully");
      }

      resetForm();
      fetchCategories();
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
      await deleteCategory(deleteTarget._id);

      showToast("Category deleted successfully");

      if (editingId === deleteTarget._id) {
        resetForm();
      }

      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Unable to delete category. Please try again.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      field: "categoryName",
      headerName: "Category",
    },
    {
      field: "categoryCode",
      headerName: "Code",
      muted: true,
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
                {editingId ? "Edit Category" : "Create Category"}
              </h6>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Category Name <span className="text-danger">*</span>
                  </label>

                  <input
                    className={`form-control ${
                      nameError ? "is-invalid" : ""
                    }`}
                    value={form.categoryName}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        categoryName: e.target.value,
                      }));

                      if (nameError) setNameError("");
                    }}
                    placeholder="General"
                    disabled={submitting}
                  />

                  {nameError && (
                    <div className="invalid-feedback">{nameError}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Category Code</label>

                  <input
                    className="form-control"
                    value={form.categoryCode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        categoryCode: e.target.value,
                      }))
                    }
                    placeholder="GEN"
                    disabled={submitting}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>

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
                    placeholder="General Category"
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
                    id="categoryActiveSwitch"
                  />

                  <label
                    className="form-check-label"
                    htmlFor="categoryActiveSwitch"
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
                <h6 className="fw-bold mb-0">Category List</h6>

                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search categories..."
                />
              </div>

              {error && (
                <div className="alert alert-danger py-2">{error}</div>
              )}

              <ResponsiveDataList
                columns={columns}
                rows={filteredCategories}
                loading={loading}
                minWidth={650}
                emptyMessage="No categories found."
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
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.categoryName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}