import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SearchBar from "../../components/common/SearchBar";
import AddButton from "../../components/common/AddButton";
import RowActions from "../../components/common/RowActions";
import { useToast } from "../../components/common/ToastContext";
import { getTeachers, deleteTeacher } from "../../services/teacherService";

export default function TeacherList() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTeachers();
      setTeachers(res.data.teachers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load teachers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filteredTeachers = teachers.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(term) ||
      t.employeeId?.toLowerCase().includes(term) ||
      (t.designation || "").toLowerCase().includes(term) ||
      (t.userId?.email || "").toLowerCase().includes(term)
    );
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTeacher(deleteTarget._id);
      showToast("Teacher deactivated successfully");
      setDeleteTarget(null);
      fetchTeachers();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to deactivate teacher. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: "employeeId", headerName: "Employee ID" },
    { field: "name", headerName: "Name", render: (row) => `${row.firstName} ${row.lastName}` },
    { field: "email", headerName: "Email", render: (row) => row.userId?.email || "—" },
    { field: "designation", headerName: "Designation", muted: true },
    { field: "department", headerName: "Department", muted: true },
    {
      field: "status",
      headerName: "Status",
      render: (row) => (
        <span className={`badge ${row.status === "Active" ? "bg-success" : "bg-secondary"} bg-opacity-75`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="d-flex flex-column gap-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="fw-bold mb-0">Teacher Master</h4>

          <div className="d-flex flex-nowrap align-items-center gap-2">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search teachers..." />
            <AddButton label="Add Teacher" onClick={() => navigate("/teachers/create")} />
          </div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <ResponsiveDataList
          columns={columns}
          rows={filteredTeachers}
          loading={loading}
          minWidth={950}
          emptyMessage='No teachers found. Click "Add Teacher" to create one.'
          renderActions={(row) => (
            <RowActions
              onEdit={() => navigate(`/teachers/edit/${row._id}`)}
              onDelete={() => setDeleteTarget(row)}
            />
          )}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate Teacher"
        message={`Are you sure you want to deactivate "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? Their login access will also be disabled.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        confirmLabel="Deactivate"
      />
    </MainLayout>
  );
}