import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import RoleBadge from "../../components/common/RoleBadge";
import SearchBar from "../../components/common/SearchBar";
import AddButton from "../../components/common/AddButton";
import RowActions from "../../components/common/RowActions";
import { useToast } from "../../components/common/ToastContext";
import { getUsers, deleteUser } from "../../services/userService";

export default function UserList() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load users. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.role?.roleName || "").toLowerCase().includes(term)
    );
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      showToast("User deleted successfully");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Unable to delete user. Please try again.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };
  const columns = [
    {
      field: "name",
      headerName: "Name",
      width: "20%",
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    { field: "email", headerName: "Email", width: "25%" },
    { field: "mobile", headerName: "Mobile", width: "15%", muted: true },
    {
      field: "role",
      headerName: "Role",
      render: (row) => <RoleBadge role={row.role?.roleName} />,
    },
    {
      field: "active",
      headerName: "Status",
      width: "15%",
      render: (row) => <StatusChip active={row.active} />,
    },
  ];

  return (
    <MainLayout>
      <div className="d-flex flex-column gap-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="fw-bold mb-0">User Master</h4>

          <div className="d-flex flex-nowrap align-items-center gap-2">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search users..."
            />
            <AddButton
              label="Add User"
              onClick={() => navigate("/users/create")}
            />
          </div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <ResponsiveDataList
          columns={columns}
          rows={filteredUsers}
          loading={loading}
          minWidth={800}
          emptyMessage='No users found. Click "Add User" to create one.'
          renderActions={(row) => (
            <RowActions
              onEdit={() => navigate(`/users/edit/${row._id}`)}
              onDelete={() => setDeleteTarget(row)}
            />
          )}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}
