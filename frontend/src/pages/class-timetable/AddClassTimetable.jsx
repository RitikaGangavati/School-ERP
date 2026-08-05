import { useEffect, useState } from "react";

import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

import MainLayout from "../../components/layout/MainLayout";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

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
import AcademicYearBadge from "../../components/common/AcademicYearBadge";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const emptyForm = {
  day: "Monday",
  timeSlot: "",
  subject: "",
  roomNo: "",
  remarks: "",
};

export default function AddClassTimetable() {
  const { showToast } = useToast();
  const { currentYear } = useAcademicYear();

  // Masters
  const [allClasses, setAllClasses] = useState([]);
  const [allSubjectGroups, setAllSubjectGroups] = useState([]);
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [allSubjectTeachers, setAllSubjectTeachers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Selections
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // Grid state
  const [activeDay, setActiveDay] = useState("Monday");
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ---- Load all masters once ----
  useEffect(() => {
    (async () => {
      setLoadingOptions(true);
      try {
        const [classRes, groupRes, slotRes, subjectTeacherRes] = await Promise.all([
          getClasses(),
          getSubjectGroups(),
          getTimeSlots(),
          getSubjectTeachers(),
        ]);

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

  // ---- Derived: which classes have a SubjectGroup under the current year ----
  const classesWithGroups = currentYear
    ? allClasses.filter((c) =>
        allSubjectGroups.some(
          (g) => g.academicYear?._id === currentYear._id && g.class?._id === c._id,
        ),
      )
    : [];

  // ---- Derived: Subject Groups for current Year + selected Class ----
  const groupsForClass = allSubjectGroups.filter(
    (g) => g.academicYear?._id === currentYear?._id && g.class?._id === selectedClass,
  );

  // ---- Derived: the actual picked group object ----
  const selectedGroupObj = allSubjectGroups.find((g) => g._id === selectedGroup);
  const availableSections = selectedGroupObj?.sections || [];
  const availableSubjects = selectedGroupObj?.subjects || []; // [{ subject: {_id, subjectName}, periodsPerWeek }]

  // ---- Derived: teacher assigned to a given subject, for current Year+Class+Section ----
  const resolveTeacher = (subjectId) => {
    const match = allSubjectTeachers.find(
      (st) =>
        st.academicYear?._id === currentYear?._id &&
        st.class?._id === selectedClass &&
        st.section?._id === selectedSection &&
        st.subject?._id === subjectId,
    );
    return match?.teacher || null;
  };

  const formTeacher = form.subject ? resolveTeacher(form.subject) : null;

  // Reset downstream selections whenever an upstream one changes
  useEffect(() => {
    setSelectedGroup("");
    setSelectedSection("");
    setHasSearched(false);
    setRows([]);
  }, [selectedClass]);

  useEffect(() => {
    setSelectedSection("");
    setHasSearched(false);
    setRows([]);
  }, [selectedGroup]);

  // ---- Fetch existing timetable rows ----
  const fetchRows = async () => {
    setLoadingRows(true);
    try {
      const res = await getTimetable({
        academicYear: currentYear._id,
        class: selectedClass,
        section: selectedSection,
      });
      setRows(res.data.timetable || []);
      setHasSearched(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to load timetable.", "error");
    } finally {
      setLoadingRows(false);
    }
  };

  const handleSearch = () => {
    if (!currentYear) {
      showToast("No current academic year set. Set one in Academic Year master first.", "error");
      return;
    }
    if (!selectedClass || !selectedGroup || !selectedSection) {
      showToast("Please select Class, Subject Group and Section", "error");
      return;
    }
    fetchRows();
  };

  const handleGenerate = async () => {
    if (!currentYear) {
      showToast("No current academic year set. Set one in Academic Year master first.", "error");
      return;
    }
    if (!selectedClass || !selectedGroup || !selectedSection) {
      showToast("Please select Class, Subject Group and Section", "error");
      return;
    }

    setGenerating(true);
    try {
      const res = await generateTimetable({
        academicYear: currentYear._id,
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

      fetchRows();
    } catch (err) {
      showToast(err.response?.data?.message || "Auto-generate failed.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const rowsForDay = (day) => rows.filter((r) => r.day === day);

  const resetForm = () => {
    setForm({ ...emptyForm, day: activeDay });
    setEditingId(null);
    setFieldErrors({});
    setShowForm(false);
  };

  const handleEditClick = (row) => {
    setForm({
      day: row.day,
      timeSlot: row.timeSlot?._id || "",
      subject: row.subject?._id || "",
      roomNo: row.roomNo || "",
      remarks: row.remarks || "",
    });
    setEditingId(row._id);
    setFieldErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.timeSlot) errs.timeSlot = "Time slot is required";
    if (!form.subject) errs.subject = "Subject is required";
    if (form.subject && !formTeacher) {
      errs.subject = "No teacher assigned for this subject — set it in Subject Teacher first";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Teacher is NOT sent — backend resolves it from SubjectTeacher server-side
      const payload = {
        academicYear: currentYear._id,
        class: selectedClass,
        section: selectedSection,
        day: form.day,
        timeSlot: form.timeSlot,
        subject: form.subject,
        roomNo: form.roomNo,
        remarks: form.remarks,
      };

      if (editingId) {
        await updateTimetable(editingId, payload);
        showToast("Timetable entry updated successfully");
      } else {
        await createTimetable(payload);
        showToast("Timetable entry created successfully");
      }
      resetForm();
      fetchRows();
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTimetable(deleteTarget._id);
      showToast("Timetable entry deleted successfully");
      setDeleteTarget(null);
      fetchRows();
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to delete entry.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const readyToSearch = !!currentYear && selectedClass && selectedGroup && selectedSection;

  return (
    <MainLayout>
      <div className="d-flex flex-column gap-3">
        <div className="card shadow-sm rounded-3">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">Select Criteria</h6>
              <AcademicYearBadge/>
            </div>

            <div className="row align-items-end">
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Class <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={loadingOptions || !currentYear}
                >
                  <option value="">Select Class</option>
                  {classesWithGroups.map((c) => (
                    <option key={c._id} value={c._id}>{c.className}</option>
                  ))}
                </select>
                {currentYear && classesWithGroups.length === 0 && !loadingOptions && (
                  <div className="form-text text-warning">
                    No Subject Groups found for this year.
                  </div>
                )}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Subject Group <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">
                    {selectedClass ? "Select Group" : "Select class first"}
                  </option>
                  {groupsForClass.map((g) => (
                    <option key={g._id} value={g._id}>{g.groupName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Section <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedGroup}
                >
                  <option value="">
                    {selectedGroup ? "Select Section" : "Select group first"}
                  </option>
                  {availableSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>{sec.sectionName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={!readyToSearch || loadingRows || generating}
              >
                {loadingRows ? "Loading..." : "Search"}
              </button>

              <button
                className="btn btn-outline-primary d-flex align-items-center gap-1"
                onClick={handleGenerate}
                disabled={!readyToSearch || loadingRows || generating}
              >
                <AutoAwesomeOutlinedIcon fontSize="small" />
                {generating ? "Generating..." : "Auto Generate"}
              </button>
            </div>
          </div>
        </div>

        {hasSearched && (
          <div className="card shadow-sm rounded-3">
            <div className="card-body">
              <ul className="nav nav-tabs mb-3">
                {DAYS.map((day) => (
                  <li className="nav-item" key={day}>
                    <button
                      className={`nav-link ${activeDay === day ? "active" : ""}`}
                      onClick={() => {
                        setActiveDay(day);
                        resetForm();
                        setForm((f) => ({ ...f, day }));
                      }}
                    >
                      {day}
                    </button>
                  </li>
                ))}
                <li className="nav-item ms-auto">
                  <button
                    className="btn btn-primary btn-sm mt-1 d-flex align-items-center gap-1"
                    onClick={() => {
                      setForm({ ...emptyForm, day: activeDay });
                      setEditingId(null);
                      setShowForm(true);
                    }}
                  >
                    <AddIcon fontSize="small" />
                    Add Period
                  </button>
                </li>
              </ul>

              {showForm && (
                <form onSubmit={handleSubmit} className="border rounded-3 p-3 mb-3 bg-light">
                  <div className="row">
                    <div className="col-md-3 mb-2">
                      <label className="form-label small">
                        Time Slot <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select form-select-sm ${fieldErrors.timeSlot ? "is-invalid" : ""}`}
                        value={form.timeSlot}
                        onChange={(e) => setForm((f) => ({ ...f, timeSlot: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {allTimeSlots
                          .filter((ts) => ts.type === "Period")
                          .map((ts) => (
                            <option key={ts._id} value={ts._id}>
                              {ts.periodName} ({ts.startTime}–{ts.endTime})
                            </option>
                          ))}
                      </select>
                      {fieldErrors.timeSlot && (
                        <div className="invalid-feedback">{fieldErrors.timeSlot}</div>
                      )}
                    </div>

                    <div className="col-md-3 mb-2">
                      <label className="form-label small">
                        Subject <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select form-select-sm ${fieldErrors.subject ? "is-invalid" : ""}`}
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      >
                        <option value="">Select</option>
                        {availableSubjects.map((row) => (
                          <option key={row.subject._id} value={row.subject._id}>
                            {row.subject.subjectName} ({row.periodsPerWeek}/wk)
                          </option>
                        ))}
                      </select>
                      {fieldErrors.subject && (
                        <div className="invalid-feedback">{fieldErrors.subject}</div>
                      )}
                    </div>

                    <div className="col-md-3 mb-2">
                      <label className="form-label small">Teacher</label>
                      <input
                        className="form-control form-control-sm"
                        value={
                          formTeacher
                            ? `${formTeacher.firstName} ${formTeacher.lastName}`
                            : form.subject
                              ? "Not assigned"
                              : "Select subject first"
                        }
                        disabled
                      />
                      {form.subject && !formTeacher && (
                        <div className="form-text text-warning">
                          Assign a teacher for this subject in Subject Teacher first.
                        </div>
                      )}
                    </div>

                    <div className="col-md-3 mb-2">
                      <label className="form-label small">Room No.</label>
                      <input
                        className="form-control form-control-sm"
                        value={form.roomNo}
                        onChange={(e) => setForm((f) => ({ ...f, roomNo: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <label className="form-label small">Remarks</label>
                      <input
                        className="form-control form-control-sm"
                        value={form.remarks}
                        onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success btn-sm" disabled={submitting}>
                      {submitting ? "Saving..." : editingId ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div style={{ overflowX: "auto" }}>
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Time Slot</th>
                      <th>Subject</th>
                      <th>Teacher</th>
                      <th>Room No.</th>
                      <th>Remarks</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsForDay(activeDay).map((row) => (
                      <tr key={row._id}>
                        <td>
                          {row.timeSlot?.periodName} ({row.timeSlot?.startTime}–{row.timeSlot?.endTime})
                        </td>
                        <td>{row.subject?.subjectName}</td>
                        <td>{row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : "—"}</td>
                        <td>{row.roomNo || "—"}</td>
                        <td>{row.remarks || "—"}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => handleEditClick(row)}
                          >
                            <EditIcon fontSize="small" />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {rowsForDay(activeDay).length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          No periods added for {activeDay} yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Timetable Entry"
        message="Are you sure you want to delete this period? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </MainLayout>
  );
}