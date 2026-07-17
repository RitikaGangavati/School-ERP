import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  CircularProgress,
} from "@mui/material";

export default function RoleForm({ open, onClose, onSubmit, initialData }) {
  const isEdit = Boolean(initialData);

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRoleName(initialData?.roleName || "");
      setDescription(initialData?.description || "");
      setActive(initialData?.active ?? true);
      setNameError("");
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      setNameError("Role name is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        roleName: roleName.trim(),
        description: description.trim(),
        active,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Role" : "Add Role"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Role Name"
            fullWidth
            value={roleName}
            onChange={(e) => {
              setRoleName(e.target.value);
              if (nameError) setNameError("");
            }}
            error={!!nameError}
            helperText={nameError}
            disabled={submitting}
            autoFocus
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />

          <FormControlLabel
            control={
              <Switch
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                disabled={submitting}
              />
            }
            label={active ? "Active" : "Inactive"}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <CircularProgress size={22} color="inherit" />
          ) : isEdit ? (
            "Update"
          ) : (
            "Save"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}