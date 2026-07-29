import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";

export default function RowActions({ onEdit, onDelete }) {
  return (
    <div className="d-flex gap-1">
      <button
         className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
  style={{ width: 32, height: 32 }}
        onClick={onEdit}
        title="Edit"
      >
        <EditIcon style={{ fontSize: 16 }} />
      </button>
      <button
        className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
          style={{ width: 32, height: 32 }}
        onClick={onDelete}
        title="Delete"
      >
        <DeleteIcon style={{ fontSize: 16 }} />
      </button>
    </div>
  );
}