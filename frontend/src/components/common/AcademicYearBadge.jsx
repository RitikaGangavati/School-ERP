import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { useAcademicYear } from "../../context/AcademicYearContext";

export default function AcademicYearBadge() {
  const { currentYear, loading, error } = useAcademicYear();

  if (loading) return null;

  if (error || !currentYear) {
    return (
      <span
        className="d-flex align-items-center gap-1 px-2 py-1 rounded-2 small"
        style={{ background: "#FEF2F2", color: "#991B1B" }}
        title="Set a current academic year in Academic Year master"
      >
        <CalendarMonthOutlinedIcon style={{ fontSize: 14 }} />
        No year set
      </span>
    );
  }

  return (
    <span
      className="d-flex align-items-center gap-1 px-2 py-1 rounded-2 small fw-semibold"
      style={{ background: "#EEF2FF", color: "#4F46E5" }}
    >
      <CalendarMonthOutlinedIcon style={{ fontSize: 14 }} />
      {currentYear.name}
    </span>
  );
}