import { Chip } from "@mui/material";

export default function StatusChip({ active }) {
  return (
    <Chip
      label={active ? "Active" : "Inactive"}
      color={active ? "success" : "default"}
      size="small"
      variant={active ? "filled" : "outlined"}
    />
  );
}