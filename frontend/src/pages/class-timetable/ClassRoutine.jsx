import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarViewWeekOutlinedIcon from "@mui/icons-material/CalendarViewWeekOutlined";

import MainLayout from "../../components/layout/MainLayout";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../context/ToastContext";

import { getAcademicYears } from "../../services/academicYearService";
import { getClasses } from "../../services/classService";
import { getSubjectGroups } from "../../services/subjectGroupService";
import { getTimeSlots } from "../../services/timeSlotService";
import { getSubjectTeachers } from "../../services/subjectTeacherService";
import {
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  generateTimetable,
} from "../../services/timetableService";

const DAYS = [
  { key: "Monday", accent: "#6366F1" },
  { key: "Tuesday", accent: "#0EA5E9" },
  { key: "Wednesday", accent: "#14B8A6" },
  { key: "Thursday", accent: "#F59E0B" },
  { key: "Friday", accent: "#F97316" },
  { key: "Saturday", accent: "#A855F7" },
];

export default function ClassRoutine() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [allYears, setAllYears] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allSubjectGroups, setAllSubjectGroups] = useState([]);
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [allSubjectTeachers, setAllSubjectTeachers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [entries, setEntries] = useState([]);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Cell modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null); // { day, slot, existingEntry }
  const [form, setForm] = useState({ subject: "", roomNo: "", remarks: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingOptions(true);
      try {
        const [yearRes, classRes, groupRes, slotRes, subjectTeacherRes] = await Promise.all([
          getAcademicYears(),
          getClasses(),
          getSubjectGroups(),
          getTimeSlots(),
          getSubjectTeachers(),
        ]);

        setAllYears(yearRes.data.academicYears || []);
        setAllClasses((classRes.data.classes || []).filter((c) => c.active));
        setAllSubjectGroups((groupRes.data.subjectGroups || []).filter((g) => g.active));
        setAllTimeSlots(
          (slotRes.data.timeSlots || [])
            .filter((s) => s.active)
            .sort((a, b) => a.displayOrder - b.displayOrder),
        );
        setAllSubjectTeachers(subjectTeacherRes.data.subjectTeachers || []);
      } catch (err) {
        showToast("Failed to load form data", "error");
      } finally {
        setLoadingOptions(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classesWithGroups = selectedYear
    ? allClasses.filter((c) =>
        allSubjectGroups.some((g) => g.academicYear?._id === selectedYear && g.class?._id === c._id),
      )
    : [];

  const groupsForClass = allSubjectGroups.filter(
    (g) => g.academicYear?._id === selectedYear && g.class?._id === selectedClass,
  );

  const selectedGroupObj = allSubjectGroups.find((g) => g._id === selectedGroup);
  const availableSections = selectedGroupObj?.sections || [];
  const availableSubjects = selectedGroupObj?.subjects || [];

  useEffect(() => {
    setSelectedClass(""); setSelectedGroup(""); setSelectedSection("");
    setHasSearched(false); setEntries([]);
  }, [selectedYear]);

  useEffect(() => {
    setSelectedGroup(""); setSelectedSection("");
    setHasSearched(false); setEntries([]);
  }, [selectedClass]);

  useEffect(() => {
    setSelectedSection("");
    setHasSearched(false); setEntries([]);
  }, [selectedGroup]);

  const resolveTeacher = useCallback(
    (subjectId) => {
      const match = allSubjectTeachers.find(
        (st) =>
          st.academicYear?._id === selectedYear &&
          st.class?._id === selectedClass &&
          st.section?._id === selectedSection &&
          st.subject?._id === subjectId,
      );
      return match?.teacher || null;
    },
    [allSubjectTeachers, selectedYear, selectedClass, selectedSection],
  );

  const readyToSearch = selectedYear && selectedClass && selectedGroup && selectedSection;

  const fetchGrid = useCallback(async () => {
    if (!readyToSearch) return;
    setLoadingGrid(true);
    try {
      const res = await getTimetable({
        academicYear: selectedYear,
        class: selectedClass,
        section: selectedSection,
      });
      setEntries(res.data.timetable || []);
      setHasSearched(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to load timetable", "error");
    } finally {
      setLoadingGrid(false);
    }
  }, [readyToSearch, selectedYear, selectedClass, selectedSection, showToast]);

  const handleSearch = () => {
    if (!readyToSearch) {
      showToast("Please select Academic Year, Class, Subject Group and Section", "error");
      return;
    }
    fetchGrid();
  };

  const handleGenerate = async () => {
    if (!readyToSearch) {
      showToast("Please select Academic Year, Class, Subject Group and Section", "error");
      return;
    }
    setGenerating(true);
    try {
      const res = await generateTimetable({
        academicYear: selectedYear,
        class: selectedClass,
        section: selectedSection,
        subjectGroup: selectedGroup,
      });
      showToast(res.data.message);
      if (res.data.unresolved?.length > 0) {
        res.data.unresolved.forEach((u) =>
          showToast(`${u.subject}: placed ${u.placed}/${u.needed} — ${u.reason}`, "error"),
        );
      }
      fetchGrid();
    } catch (err) {
      showToast(err.response?.data?.message || "Auto-generate failed.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const entryMap = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const slotId = e.timeSlot?._id || e.timeSlot;
      map[`${e.day}_${slotId}`] = e;
    });
    return map;
  }, [entries]);

  // ---- Cell click ----
  const openCell = (day, slot) => {
    const key = `${day}_${slot._id}`;
    const existing = entryMap[key];
    setModalContext({ day, slot, existingEntry: existing || null });
    setForm(
      existing
        ? { subject: existing.subject?._id || "", roomNo: existing.roomNo || "", remarks: existing.remarks || "" }
        : { subject: "", roomNo: "", remarks: "" },
    );
    setFieldErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContext(null);
    setForm({ subject: "", roomNo: "", remarks: "" });
    setFieldErrors({});
  };

  const formTeacher = form.subject ? resolveTeacher(form.subject) : null;

  const validate = () => {
    const errs = {};
    if (!form.subject) errs.subject = "Subject is required";
    else if (!formTeacher) errs.subject = "No teacher assigned for this subject — set it in Subject Teacher first";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      academicYear: selectedYear,
      class: selectedClass,
      section: selectedSection,
      day: modalContext.day,
      timeSlot: modalContext.slot._id,
      subject: form.subject,
      roomNo: form.roomNo,
      remarks: form.remarks,
    };

    try {
      if (modalContext.existingEntry) {
        await updateTimetable(modalContext.existingEntry._id, payload);
        showToast("Period updated");
      } else {
        await createTimetable(payload);
        showToast("Period added");
      }
      closeModal();
      fetchGrid();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTimetable(deleteTarget._id);
      showToast("Period removed");
      setDeleteTarget(null);
      closeModal();
      fetchGrid();
    } catch (err) {
      showToast("Unable to delete", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <style>{`
        .cr-cell { min-width: 168px; vertical-align: top; padding: 8px !important; }
        .cr-card {
          background: #fff; border: 1px solid #ECECEF; border-left: 3px solid var(--day-accent);
          border-radius: 8px; padding: 10px 12px; position: relative;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .cr-card:hover { box-shadow: 0 2px 10px rgba(15,23,42,0.08); transform: translateY(-1px); }
        .cr-card-actions { position: absolute; top: 6px; right: 6px; display: flex; gap: 4px; }
        .cr-icon-btn {
          width: 22px; height: 22px; border-radius: 6px; border: none; display: flex;
          align-items: center; justify-content: center; background: #F1F5F9; color: #64748B;
        }
        .cr-icon-btn:hover { background: #E2E8F0; }
        .cr-subject { font-weight: 700; font-size: 0.88rem; color: #0F172A; margin-bottom: 3px; }
        .cr-meta { font-size: 0.75rem; color: #64748B; line-height: 1.5; }
        .cr-empty-cell {
          height: 100%; min-height: 58px; border: 1.5px dashed #E2E8F0; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; color: #CBD5E1;
          cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease;
        }
        .cr-empty-cell:hover { border-color: #6366F1; color: #6366F1; }
        .cr-break-row td {
          background: #FBFAF7; color: #92700F; font-size: 0.78rem; font-weight: 600;
          padding: 6px 12px !important; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .cr-day-th { border-bottom: 3px solid var(--day-accent) !important; }
        .cr-header-row th {
          background: #F8FAFC; border-bottom: 2px solid #E5E7EB !important; font-size: 0.78rem;
          text-transform: uppercase; letter-spacing: 0.04em; color: #475569; font-weight: 700; padding: 10px 12px;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <CalendarViewWeekOutlinedIcon style={{ color: "#4F46E5" }} />
          <h5 className="mb-0 fw-bold">Class Routine</h5>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => navigate("/subject-groups")}
          >
            <TrackChangesOutlinedIcon fontSize="small" /> Set Weekly Targets
          </button>
          <button
            className="btn btn-info btn-sm text-white d-flex align-items-center gap-1"
            onClick={() => navigate("/time-slots")}
          >
            <AccessTimeOutlinedIcon fontSize="small" /> Manage Periods
          </button>
        </div>
      </div>

      <div className="card shadow-sm rounded-3 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-uppercase text-secondary">
                Academic Year <span className="text-danger">*</span>
              </label>
              <select className="form-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={loadingOptions}>
                <option value="">Select Year</option>
                {allYears.map((y) => <option key={y._id} value={y._id}>{y.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-uppercase text-secondary">
                Class <span className="text-danger">*</span>
              </label>
              <select className="form-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={!selectedYear}>
                <option value="">{selectedYear ? "Select Class" : "Select year first"}</option>
                {classesWithGroups.map((c) => <option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-uppercase text-secondary">
                Subject Group <span className="text-danger">*</span>
              </label>
              <select className="form-select" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} disabled={!selectedClass}>
                <option value="">{selectedClass ? "Select Group" : "Select class first"}</option>
                {groupsForClass.map((g) => <option key={g._id} value={g._id}>{g.groupName}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-uppercase text-secondary">
                Section <span className="text-danger">*</span>
              </label>
              <select className="form-select" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={!selectedGroup}>
                <option value="">{selectedGroup ? "Select Section" : "Select group first"}</option>
                {availableSections.map((s) => <option key={s._id} value={s._id}>{s.sectionName}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary mt-3" onClick={handleSearch} disabled={!readyToSearch || loadingGrid}>
            {loadingGrid ? "Loading..." : "Show Timetable"}
          </button>
        </div>
      </div>

      {!hasSearched && (
        <div className="text-center text-muted py-5">
          Select Academic Year, Class, Subject Group and Section, then click Show Timetable.
        </div>
      )}

      {hasSearched && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">Class Schedule Matrix Overview</h6>
            <button
              className="btn btn-success btn-sm d-flex align-items-center gap-1"
              onClick={handleGenerate}
              disabled={generating}
            >
              <AutoAwesomeOutlinedIcon fontSize="small" />
              {generating ? "Generating..." : "Auto-Generate Timetable"}
            </button>
          </div>

          <div className="table-responsive bg-white" style={{ borderRadius: 12, border: "1px solid #E5E7EB" }}>
            <table className="table mb-0" style={{ borderCollapse: "separate" }}>
              <thead>
                <tr className="cr-header-row">
                  <th style={{ minWidth: 140 }}>Day / Period</th>
                  {allTimeSlots.map((slot) => (
                    <th key={slot._id} className={slot.type === "Period" ? "" : ""}>
                      {slot.periodName}
                      <div className="text-muted fw-normal">{slot.startTime} - {slot.endTime}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d) => (
                  <tr key={d.key}>
                    <td className="fw-semibold" style={{ minWidth: 100 }}>{d.key}</td>
                    {allTimeSlots.map((slot) => {
                      if (slot.type !== "Period") {
                        return (
                          <td key={slot._id} className="cr-break-row text-center" style={{ writingMode: "vertical-rl" }}>
                            {slot.type}
                          </td>
                        );
                      }
                      const entry = entryMap[`${d.key}_${slot._id}`];
                      return (
                        <td key={slot._id} className="cr-cell" style={{ "--day-accent": d.accent }}>
                          {entry ? (
                            <div className="cr-card">
                              <div className="cr-card-actions">
                                <button className="cr-icon-btn" onClick={() => openCell(d.key, slot)}>
                                  <EditIcon style={{ fontSize: 14 }} />
                                </button>
                                <button className="cr-icon-btn" onClick={() => setDeleteTarget(entry)}>
                                  <DeleteIcon style={{ fontSize: 14 }} />
                                </button>
                              </div>
                              <div className="cr-subject">{entry.subject?.subjectName}</div>
                              <div className="cr-meta">{entry.teacher?.firstName} {entry.teacher?.lastName}</div>
                              {entry.roomNo && <div className="cr-meta">Rm: {entry.roomNo}</div>}
                            </div>
                          ) : (
                            <div className="cr-empty-cell" onClick={() => openCell(d.key, slot)}>
                              <AddIcon fontSize="small" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalOpen && modalContext && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalContext.existingEntry ? "Edit" : "Add"} — {modalContext.day}, {modalContext.slot.periodName}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Subject <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${fieldErrors.subject ? "is-invalid" : ""}`}
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    >
                      <option value="">Select Subject</option>
                      {availableSubjects.map((row) => (
                        <option key={row.subject._id} value={row.subject._id}>
                          {row.subject.subjectName} ({row.periodsPerWeek}/wk)
                        </option>
                      ))}
                    </select>
                    {fieldErrors.subject && <div className="invalid-feedback">{fieldErrors.subject}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Teacher</label>
                    <input
                      className="form-control"
                      disabled
                      value={
                        formTeacher
                          ? `${formTeacher.firstName} ${formTeacher.lastName}`
                          : form.subject ? "Not assigned" : "Select subject first"
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Room No</label>
                    <input
                      className="form-control"
                      value={form.roomNo}
                      onChange={(e) => setForm((f) => ({ ...f, roomNo: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Remarks</label>
                    <input
                      className="form-control"
                      value={form.remarks}
                      onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  {modalContext.existingEntry && (
                    <button
                      type="button"
                      className="btn btn-outline-danger me-auto"
                      onClick={() => setDeleteTarget(modalContext.existingEntry)}
                    >
                      <DeleteIcon fontSize="small" className="me-1" /> Delete
                    </button>
                  )}
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Saving..." : modalContext.existingEntry ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Period"
        message={`Remove ${deleteTarget?.subject?.subjectName || "this"} period?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}