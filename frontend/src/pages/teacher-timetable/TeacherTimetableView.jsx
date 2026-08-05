import { useEffect, useState, useCallback, useMemo } from "react";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";

import MainLayout from "../../components/layout/MainLayout";
import { useToast } from "../../components/common/ToastContext";

import { getTimetable } from "../../services/timetableService";
import { getTimeSlots } from "../../services/timeSlotService";
import { getAcademicYears } from "../../services/academicYearService";
import { getTeachers } from "../../services/teacherService";

const DAYS = [
  { key: "Monday", accent: "#6366F1" },
  { key: "Tuesday", accent: "#0EA5E9" },
  { key: "Wednesday", accent: "#14B8A6" },
  { key: "Thursday", accent: "#F59E0B" },
  { key: "Friday", accent: "#F97316" },
  { key: "Saturday", accent: "#A855F7" },
];

export default function TeacherTimetableView() {
  const { showToast } = useToast();

  const [academicYears, setAcademicYears] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [academicYear, setAcademicYear] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [yearsRes, teachersRes, slotsRes] = await Promise.all([
          getAcademicYears(),
          getTeachers(),
          getTimeSlots(),
        ]);

        setAcademicYears(yearsRes.data.academicYears || []);
        setTeachers(teachersRes.data.teachers || []);

        const slots = (slotsRes.data.timeSlots || [])
          .filter((s) => s.active)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        setTimeSlots(slots);
      } catch (err) {
        showToast("Failed to load filter options", "error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(async () => {
    if (!academicYear || !teacherId) {
      showToast("Please select Academic Year and Teacher", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await getTimetable({
        academicYear,
        teacher: teacherId,
      });

      setEntries(res.data.timetable || []);
      setHasSearched(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to load timetable", "error");
    } finally {
      setLoading(false);
    }
  }, [academicYear, teacherId, showToast]);

  const entryMap = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const slotId = e.timeSlot?._id || e.timeSlot;
      map[`${e.day}_${slotId}`] = e;
    });
    return map;
  }, [entries]);

  const selectedTeacher = teachers.find((t) => t._id === teacherId);

  // How many periods this teacher is teaching, at a glance
  const periodCount = entries.length;

  return (
    <MainLayout>
      <style>{`
        .tt-page { font-variant-numeric: tabular-nums; }
        .tt-filter-card { border: 1px solid #E5E7EB; border-radius: 12px; }
        .tt-teacher-card {
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          background: linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 60%);
        }
        .tt-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          background: #4F46E5; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 1.1rem;
        }
        .tt-header-row th {
          background: #F8FAFC;
          border-bottom: 2px solid #E5E7EB !important;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #475569;
          font-weight: 700;
          padding: 10px 12px;
        }
        .tt-day-th { border-bottom: 3px solid var(--day-accent) !important; }
        .tt-period-col { min-width: 140px; background: #FAFAFA; }
        .tt-cell { min-width: 168px; vertical-align: top; padding: 8px !important; }
        .tt-card {
          background: #fff;
          border: 1px solid #ECECEF;
          border-left: 3px solid var(--day-accent);
          border-radius: 8px;
          padding: 10px 12px;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .tt-card:hover { box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08); transform: translateY(-1px); }
        .tt-class-line { font-weight: 700; font-size: 0.9rem; color: #0F172A; margin-bottom: 3px; }
        .tt-meta { font-size: 0.76rem; color: #64748B; display: flex; align-items: center; gap: 5px; line-height: 1.5; }
        .tt-empty-cell {
          height: 100%; min-height: 54px;
          border: 1.5px dashed #E2E8F0; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #CBD5E1; font-size: 0.75rem;
        }
        .tt-break-row td {
          background: #FBFAF7; color: #92700F; font-size: 0.78rem; font-weight: 600;
          padding: 6px 12px !important; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .tt-slot-name { font-weight: 700; color: #0F172A; font-size: 0.86rem; }
        .tt-slot-time { font-size: 0.74rem; color: #94A3B8; }
      `}</style>

      <div className="tt-page">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <PersonOutlineOutlinedIcon style={{ color: "#4F46E5" }} />
            <h5 className="mb-0 fw-bold" style={{ color: "#0F172A" }}>Teacher Timetable</h5>
          </div>
        </div>

        <div className="tt-filter-card p-3 mb-4 bg-white">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold small text-uppercase text-secondary">
                Academic Year <span className="text-danger">*</span>
              </label>
              <select className="form-select" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                <option value="">Select Year</option>
                {academicYears.map((y) => (
                  <option key={y._id} value={y._id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold small text-uppercase text-secondary">
                Teacher <span className="text-danger">*</span>
              </label>
              <select className="form-select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">Select Teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.firstName} {t.lastName} {t.employeeId ? `(${t.employeeId})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 d-flex gap-2">
              <button className="btn btn-primary flex-fill" onClick={handleSearch} disabled={loading}>
                {loading ? "Loading..." : "Search"}
              </button>
              {hasSearched && (
                <button className="btn btn-outline-secondary" title="Print">
                  <PrintOutlinedIcon fontSize="small" />
                </button>
              )}
            </div>
          </div>
        </div>

        {!hasSearched && (
          <div className="text-center text-muted py-5">
            Select Academic Year and Teacher, then click Search to view their timetable.
          </div>
        )}

        {hasSearched && selectedTeacher && (
          <div className="tt-teacher-card p-3 mb-4 d-flex align-items-center gap-3">
            <div className="tt-avatar">
              {selectedTeacher.firstName?.[0]}{selectedTeacher.lastName?.[0]}
            </div>
            <div className="flex-fill">
              <div className="fw-bold" style={{ color: "#0F172A" }}>
                {selectedTeacher.firstName} {selectedTeacher.lastName}
              </div>
              <div className="text-muted small">
                {selectedTeacher.employeeId && <>Employee ID: {selectedTeacher.employeeId}</>}
              </div>
            </div>
            <div className="text-end">
              <div className="fw-bold" style={{ color: "#4F46E5", fontSize: "1.3rem" }}>{periodCount}</div>
              <div className="text-muted small">periods / week</div>
            </div>
          </div>
        )}

        {hasSearched && entries.length === 0 && (
          <div className="text-center py-5 bg-white" style={{ border: "1px dashed #E2E8F0", borderRadius: 12 }}>
            <div className="fw-semibold mb-1" style={{ color: "#334155" }}>No periods assigned</div>
            <div className="text-muted small">
              {selectedTeacher?.firstName} {selectedTeacher?.lastName} isn't scheduled for any periods this year yet.
            </div>
          </div>
        )}

        {hasSearched && entries.length > 0 && (
          <div className="table-responsive bg-white" style={{ borderRadius: 12, border: "1px solid #E5E7EB" }}>
            <table className="table mb-0" style={{ borderCollapse: "separate" }}>
              <thead>
                <tr className="tt-header-row">
                  <th className="tt-period-col">Period</th>
                  {DAYS.map((d) => (
                    <th key={d.key} className="tt-day-th" style={{ "--day-accent": d.accent }}>{d.key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) =>
                  slot.type !== "Period" ? (
                    <tr key={slot._id} className="tt-break-row">
                      <td>{slot.periodName}</td>
                      <td colSpan={DAYS.length}>{slot.type} · {slot.startTime} – {slot.endTime}</td>
                    </tr>
                  ) : (
                    <tr key={slot._id}>
                      <td className="tt-cell">
                        <div className="tt-slot-name">{slot.periodName}</div>
                        <div className="tt-slot-time">{slot.startTime} – {slot.endTime}</div>
                      </td>
                      {DAYS.map((d) => {
                        const entry = entryMap[`${d.key}_${slot._id}`];
                        return (
                          <td key={d.key} className="tt-cell" style={{ "--day-accent": d.accent }}>
                            {entry ? (
                              <div className="tt-card">
                                <div className="tt-class-line">
                                  {entry.class?.className} – {entry.section?.sectionName}
                                </div>
                                <div className="tt-meta">{entry.subject?.subjectName}</div>
                                {entry.roomNo && <div className="tt-meta">Room {entry.roomNo}</div>}
                              </div>
                            ) : (
                              <div className="tt-empty-cell">Free</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}