import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import { useToast } from "../../components/common/ToastContext";
import SearchBar from "../../components/common/SearchBar";
import RoleForm from "./RoleForm";
import AddButton from "../../components/common/AddButton";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../services/roleService";

export default function RoleList() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = roles.filter(
    (role) =>
      role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getRoles();
      setRoles(res.data.roles || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load roles. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedRole) {
        await updateRole(selectedRole._id, formData);
        showToast("Role updated successfully");
      } else {
        await createRole(formData);
        showToast("Role created successfully");
      }
      setDialogOpen(false);
      fetchRoles();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
        "error",
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget._id);
      showToast("Role deleted successfully");
      setDeleteTarget(null);
      fetchRoles();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Unable to delete role. Please try again.",
        "error",
      );
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
      <Stack spacing={3} sx={{ width: "100%" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="left"
          sx={{ width: "100%", flexWrap: "wrap", gap: 2 }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{ ml: "auto" }}
            flexWrap="wrap"
          >
            <Typography variant="h5" fontWeight="bold">
              Role Master
            </Typography>

            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search roles..."
            />

            <AddButton
              label="Add Role"
              onClick={() => {
                setSelectedRole(null);
                setDialogOpen(true);
              }}
            />
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <ResponsiveDataList
          columns={columns}
          rows={filteredRoles}
          loading={loading}
          emptyMessage='No roles found. Click "Add Role" to create one.'
          primaryField="roleName"
          renderActions={(row) => (
            <>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    setSelectedRole(row);
                    setDialogOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteTarget(row)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        />
      </Stack>

      <RoleForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedRole}
      />

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
