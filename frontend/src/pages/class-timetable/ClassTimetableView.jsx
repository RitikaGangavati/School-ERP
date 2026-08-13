import { useEffect, useState, useCallback, useMemo } from "react";

import AddIcon from "@mui/icons-material/Add";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import CalendarViewWeekOutlinedIcon from "@mui/icons-material/CalendarViewWeekOutlined";
import { useNavigate } from "react-router-dom";

import MainLayout from "../../components/layout/MainLayout";
import { useToast } from "../../context/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

import { getTimetable } from "../../services/timetableService";
import { getTimeSlots } from "../../services/timeSlotService";
import { getClasses } from "../../services/classService";
import { getClassTeachers } from "../../services/classTeacherService";
import AcademicYearBadge from "../../components/common/AcademicYearBadge";

const DAYS = [
  { key: "Monday", accent: "#6366F1" },
  { key: "Tuesday", accent: "#0EA5E9" },
  { key: "Wednesday", accent: "#14B8A6" },
  { key: "Thursday", accent: "#F59E0B" },
  { key: "Friday", accent: "#F97316" },
  { key: "Saturday", accent: "#A855F7" },
];

export default function ClassTimetableView() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { currentYear } = useAcademicYear();

  const [classes, setClasses] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [classTeachers, setClassTeachers] = useState([]);

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [classesRes, slotsRes, classTeachersRes] = await Promise.all([
          getClasses(),
          getTimeSlots(),
          getClassTeachers(),
        ]);

        setClasses((classesRes.data.classes || []).filter((c) => c.active));
        setClassTeachers(
          (classTeachersRes.data.classTeachers || []).filter((ct) => ct.active),
        );

        const slots = (slotsRes.data.timeSlots || [])
          .filter((s) => s.active)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        setTimeSlots(slots);
      } catch (err) {
        showToast("Failed to load filter options", "error");
      }
    })();
  }, []);

  const selectedClassObj = classes.find((c) => c._id === classId);
  const availableSections = (selectedClassObj?.sections || []).filter(
    (s) => s.active !== false,
  );
  const assignedClassTeacher = classTeachers.find(
    (ct) =>
      ct.academicYear?._id === currentYear?._id &&
      ct.class?._id === classId &&
      ct.section?._id === sectionId,
  );

  useEffect(() => {
    setSectionId("");
  }, [classId]);

  const handleSearch = useCallback(async () => {
    if (!currentYear) {
      showToast("No current academic year set. Set one in Academic Year master first.", "error");
      return;
    }
    if (!classId || !sectionId) {
      showToast("Please select Class and Section", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await getTimetable({
        academicYear: currentYear._id,
        class: classId,
        section: sectionId,
      });

      setEntries(res.data.timetable || []);
      setHasSearched(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Unable to load timetable",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentYear, classId, sectionId, showToast]);

  const entryMap = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const slotId = e.timeSlot?._id || e.timeSlot;
      map[`${e.day}_${slotId}`] = e;
    });
    return map;
  }, [entries]);

  const selectedSectionLabel = availableSections.find(
    (s) => s._id === sectionId,
  )?.sectionName;

  return (
    <MainLayout>
      <style>{`
        .tt-page { font-variant-numeric: tabular-nums; }
        .tt-filter-card { border: 1px solid #E5E7EB; border-radius: 12px; }
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
        .tt-subject { font-weight: 700; font-size: 0.9rem; color: #0F172A; margin-bottom: 3px; }
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
            <CalendarViewWeekOutlinedIcon style={{ color: "#4F46E5" }} />
            <h5 className="mb-0 fw-bold" style={{ color: "#0F172A" }}>
              Class Timetable
            </h5>
            <AcademicYearBadge/>
          </div>

          <button
            className="btn btn-primary d-flex align-items-center gap-1"
            onClick={() => navigate("/add-class-timetable")}
          >
            <AddIcon fontSize="small" />
            Manage Timetable
          </button>
        </div>

        <div className="tt-filter-card p-3 mb-4 bg-white">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold small text-uppercase text-secondary">
                Class <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold small text-uppercase text-secondary">
                Section <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={!classId}
              >
                <option value="">
                  {classId ? "Select Section" : "Select class first"}
                </option>
                {availableSections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.sectionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 d-flex gap-2">
              <button
                className="btn btn-primary flex-fill"
                onClick={handleSearch}
                disabled={loading}
              >
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
            Select Class and Section, then click Search to view the timetable.
          </div>
        )}

        {hasSearched && (
          <div
            className="d-flex align-items-center gap-2 mb-3 px-3 py-2"
            style={{
              background: assignedClassTeacher ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${assignedClassTeacher ? "#BBF7D0" : "#FECACA"}`,
              borderRadius: 8,
              fontSize: "0.85rem",
            }}
          >
            <span className="fw-semibold" style={{ color: "#334155" }}>
              Class Teacher:
            </span>
            {assignedClassTeacher ? (
              <span style={{ color: "#166534" }}>
                {assignedClassTeacher.teacher?.firstName}{" "}
                {assignedClassTeacher.teacher?.lastName}
                {assignedClassTeacher.teacher?.employeeId && (
                  <span className="text-muted">
                    {" "}
                    ({assignedClassTeacher.teacher.employeeId})
                  </span>
                )}
              </span>
            ) : (
              <span style={{ color: "#991B1B" }}>Not assigned</span>
            )}
          </div>
        )}

        {hasSearched && entries.length === 0 && (
          <div
            className="text-center py-5 bg-white"
            style={{ border: "1px dashed #E2E8F0", borderRadius: 12 }}
          >
            <div className="fw-semibold mb-1" style={{ color: "#334155" }}>
              No periods scheduled yet
            </div>
            <div className="text-muted small mb-3">
              {selectedClassObj?.className} – {selectedSectionLabel} doesn't
              have a timetable set up.
            </div>
            <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1">
              <AddIcon fontSize="small" />
              Build Timetable
            </button>
          </div>
        )}

        {hasSearched && entries.length > 0 && (
          <div
            className="table-responsive bg-white"
            style={{ borderRadius: 12, border: "1px solid #E5E7EB" }}
          >
            <table
              className="table mb-0"
              style={{ borderCollapse: "separate" }}
            >
              <thead>
                <tr className="tt-header-row">
                  <th className="tt-period-col">Period</th>
                  {DAYS.map((d) => (
                    <th
                      key={d.key}
                      className="tt-day-th"
                      style={{ "--day-accent": d.accent }}
                    >
                      {d.key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) =>
                  slot.type !== "Period" ? (
                    <tr key={slot._id} className="tt-break-row">
                      <td>{slot.periodName}</td>
                      <td colSpan={DAYS.length}>
                        {slot.type} · {slot.startTime} – {slot.endTime}
                      </td>
                    </tr>
                  ) : (
                    <tr key={slot._id}>
                      <td className="tt-cell">
                        <div className="tt-slot-name">{slot.periodName}</div>
                        <div className="tt-slot-time">
                          {slot.startTime} – {slot.endTime}
                        </div>
                      </td>
                      {DAYS.map((d) => {
                        const entry = entryMap[`${d.key}_${slot._id}`];
                        return (
                          <td
                            key={d.key}
                            className="tt-cell"
                            style={{ "--day-accent": d.accent }}
                          >
                            {entry ? (
                              <div className="tt-card">
                                <div className="tt-subject">
                                  {entry.subject?.subjectName}
                                  {entry.subject?.subjectCode && (
                                    <span className="text-muted fw-normal">
                                      {" "}
                                      ({entry.subject.subjectCode})
                                    </span>
                                  )}
                                </div>
                                <div className="tt-meta">
                                  {entry.teacher?.firstName}{" "}
                                  {entry.teacher?.lastName}
                                </div>
                                {entry.roomNo && (
                                  <div className="tt-meta">
                                    Room {entry.roomNo}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="tt-empty-cell">Free</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}