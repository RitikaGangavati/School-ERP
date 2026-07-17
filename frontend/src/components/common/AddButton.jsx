import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function AddButton({ label = "Add", onClick, ...rest }) {
  return (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onClick}
      {...rest}
    >
      {label}
    </Button>
  );
}