import AddIcon from "@mui/icons-material/Add";

export default function AddButton({ label = "Add", onClick, ...rest }) {
  return (
    <button
      className="btn btn-primary d-flex align-items-center gap-1 text-nowrap flex-shrink-0"
      onClick={onClick}
      {...rest}
    >
      <AddIcon fontSize="small" />
      {label}
    </button>
  );
}