import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import AcademicYearBadge from "../../components/common/AcademicYearBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";

import { useToast } from "../../context/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

import { getClasses } from "../../services/classService";
import { getTimeSlots } from "../../services/timeSlotService";
import { getSubjectTeachers } from "../../services/subjectTeacherService";

import {
  createTimetable,
  getTimetableBySection,
  updateTimetable,
  deleteTimetable,
} from "../../services/timetableService";

import SaveIcon from "@mui/icons-material/SaveOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const emptyForm = {
  class: "",
  section: "",
};

export default function Timetable() {
  const { showToast } = useToast();
  const { currentYear } = useAcademicYear();

  // =====================================================
  // OPTIONS
  // =====================================================

  const [allClasses, setAllClasses] = useState([]);
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [allSubjectTeachers, setAllSubjectTeachers] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState(emptyForm);

  // =====================================================
  // TIMETABLE DATA
  // =====================================================

  const [timetableRows, setTimetableRows] = useState([]);

  const [loadingTimetable, setLoadingTimetable] =
    useState(false);

  const [saving, setSaving] = useState(false);

  // =====================================================
  // EDIT
  // =====================================================

  const [editingId, setEditingId] = useState(null);

  // =====================================================
  // DELETE
  // =====================================================

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // FETCH OPTIONS
  // =====================================================

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);

    try {
      const [
        classRes,
        timeSlotRes,
        subjectTeacherRes,
      ] = await Promise.all([
        getClasses(),
        getTimeSlots(),
        getSubjectTeachers(),
      ]);

      setAllClasses(
        classRes.data.classes || []
      );

      setAllTimeSlots(
        timeSlotRes.data.timeSlots || []
      );

      setAllSubjectTeachers(
        subjectTeacherRes.data.subjectTeachers || []
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to load timetable options",
        "error"
      );
    } finally {
      setLoadingOptions(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // =====================================================
  // SELECTED CLASS
  // =====================================================

  const selectedClass = useMemo(() => {
    return allClasses.find(
      (item) =>
        String(item._id) ===
        String(form.class)
    );
  }, [allClasses, form.class]);

  const availableSections =
    selectedClass?.sections || [];

  // =====================================================
  // ACTIVE TIME SLOTS
  // =====================================================

  const activeTimeSlots = useMemo(() => {
    return [...allTimeSlots]
      .filter((slot) => slot.active !== false)
      .sort(
        (a, b) =>
          Number(a.displayOrder) -
          Number(b.displayOrder)
      );
  }, [allTimeSlots]);

  // =====================================================
  // GET SUBJECT TEACHERS FOR CURRENT SECTION
  // =====================================================

  const sectionSubjectTeachers = useMemo(() => {
    if (
      !currentYear ||
      !form.class ||
      !form.section
    ) {
      return [];
    }

    return allSubjectTeachers.filter((row) => {
      const yearId =
        row.academicYear?._id ||
        row.academicYear;

      const classId =
        row.class?._id ||
        row.class;

      const sectionId =
        row.section?._id ||
        row.section;

      return (
        String(yearId) ===
          String(currentYear._id) &&
        String(classId) ===
          String(form.class) &&
        String(sectionId) ===
          String(form.section)
      );
    });
  }, [
    allSubjectTeachers,
    currentYear,
    form.class,
    form.section,
  ]);

  // =====================================================
  // FETCH TIMETABLE
  // =====================================================

  const fetchTimetable = useCallback(
    async () => {
      if (
        !currentYear ||
        !form.class ||
        !form.section
      ) {
        setTimetableRows([]);
        return;
      }

      setLoadingTimetable(true);

      try {
        const res =
          await getTimetableBySection({
            academicYear: currentYear._id,
            class: form.class,
            section: form.section,
          });

        setTimetableRows(
          res.data.timetables || []
        );
      } catch (err) {
        showToast(
          err.response?.data?.message ||
            "Failed to load timetable",
          "error"
        );

        setTimetableRows([]);
      } finally {
        setLoadingTimetable(false);
      }
    },
    [
      currentYear,
      form.class,
      form.section,
      showToast,
    ]
  );

  // =====================================================
  // LOAD WHEN CLASS / SECTION CHANGES
  // =====================================================

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // =====================================================
  // CLASS CHANGE
  // =====================================================

  const handleClassChange = (classId) => {
    setForm({
      class: classId,
      section: "",
    });

    setTimetableRows([]);
    setEditingId(null);
  };

  // =====================================================
  // SECTION CHANGE
  // =====================================================

  const handleSectionChange = (sectionId) => {
    setForm((prev) => ({
      ...prev,
      section: sectionId,
    }));

    setEditingId(null);
  };

  // =====================================================
  // FIND CELL
  // =====================================================

  const getCell = (day, timeSlotId) => {
    return timetableRows.find((row) => {
      const rowSlot =
        row.timeSlot?._id ||
        row.timeSlot;

      return (
        row.day === day &&
        String(rowSlot) ===
          String(timeSlotId)
      );
    });
  };

  // =====================================================
  // GET SUBJECT TEACHER
  // =====================================================

  const getSubjectTeacher = (
    subjectTeacherId
  ) => {
    return sectionSubjectTeachers.find(
      (row) =>
        String(row._id) ===
        String(subjectTeacherId)
    );
  };

  // =====================================================
  // ADD / EDIT CELL
  // =====================================================

  const handleCellClick = (
    day,
    timeSlot
  ) => {
    if (!form.class || !form.section) {
      showToast(
        "Please select class and section first",
        "warning"
      );
      return;
    }

    if (timeSlot.type !== "Period") {
      return;
    }

    const existing = getCell(
      day,
      timeSlot._id
    );

    if (existing) {
      setEditingId(existing._id);
      return;
    }

    setEditingId(
      `new-${day}-${timeSlot._id}`
    );
  };

  // =====================================================
  // SAVE NEW / UPDATE CELL
  // =====================================================

  const handleSaveCell = async (
    day,
    timeSlot,
    subjectTeacherId,
    roomNo,
    remarks
  ) => {
    if (
      !currentYear ||
      !form.class ||
      !form.section
    ) {
      return;
    }

    if (!subjectTeacherId) {
      showToast(
        "Please select a subject",
        "warning"
      );
      return;
    }

    const subjectTeacher =
      getSubjectTeacher(
        subjectTeacherId
      );

    if (!subjectTeacher) {
      showToast(
        "Invalid subject teacher assignment",
        "error"
      );
      return;
    }

    const subjectId =
      subjectTeacher.subject?._id ||
      subjectTeacher.subject;

    const teacherId =
      subjectTeacher.teacher?._id ||
      subjectTeacher.teacher;

    const payload = {
      academicYear: currentYear._id,
      class: form.class,
      section: form.section,
      day,
      timeSlot: timeSlot._id,
      subject: subjectId,
      teacher: teacherId,
      roomNo: roomNo || "",
      remarks: remarks || "",
    };

    setSaving(true);

    try {
      if (
        editingId &&
        !String(editingId).startsWith("new-")
      ) {
        await updateTimetable(
          editingId,
          payload
        );

        showToast(
          "Timetable updated successfully"
        );
      } else {
        await createTimetable(payload);

        showToast(
          "Timetable created successfully"
        );
      }

      setEditingId(null);

      await fetchTimetable();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to save timetable",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteTimetable(
        deleteTarget._id
      );

      showToast(
        "Timetable entry removed successfully"
      );

      setDeleteTarget(null);

      await fetchTimetable();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to remove timetable entry",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <MainLayout>
      <div className="container-fluid">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="card shadow-sm rounded-3 mb-4">
          <div className="card-body">

            <div className="d-flex justify-content-between align-items-start mb-4">

              <div>
                <h5 className="fw-bold mb-1">
                  Timetable
                </h5>

                <p className="text-muted small mb-0">
                  Create and manage weekly class timetable
                </p>
              </div>

              <AcademicYearBadge />

            </div>

            {/* =================================================
                CLASS / SECTION
            ================================================= */}

            <div className="row g-3">

              <div className="col-md-5">

                <label className="form-label fw-semibold">
                  Class
                  <span className="text-danger">
                    {" "}*
                  </span>
                </label>

                <select
                  className="form-select"
                  value={form.class}
                  onChange={(e) =>
                    handleClassChange(
                      e.target.value
                    )
                  }
                  disabled={
                    loadingOptions ||
                    saving
                  }
                >
                  <option value="">
                    Select Class
                  </option>

                  {allClasses.map(
                    (item) => (
                      <option
                        key={item._id}
                        value={item._id}
                      >
                        {item.className}
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="col-md-5">

                <label className="form-label fw-semibold">
                  Section
                  <span className="text-danger">
                    {" "}*
                  </span>
                </label>

                <select
                  className="form-select"
                  value={form.section}
                  onChange={(e) =>
                    handleSectionChange(
                      e.target.value
                    )
                  }
                  disabled={
                    !form.class ||
                    loadingOptions ||
                    saving
                  }
                >
                  <option value="">
                    {form.class
                      ? "Select Section"
                      : "Select Class First"}
                  </option>

                  {availableSections.map(
                    (section) => (
                      <option
                        key={section._id}
                        value={section._id}
                      >
                        {section.sectionName}
                      </option>
                    )
                  )}
                </select>

              </div>

            </div>

          </div>
        </div>

        {/* =================================================
            TIMETABLE
        ================================================= */}

        {form.class &&
        form.section ? (

          <div className="card shadow-sm rounded-3">

            <div className="card-body">

              {/* HEADER */}

              <div className="d-flex justify-content-between align-items-center mb-3">

                <div>
                  <h6 className="fw-bold mb-1">
                    Weekly Timetable
                  </h6>

                  <small className="text-muted">
                    Click a period to assign a subject
                  </small>
                </div>

                <span className="badge bg-primary">
                  {sectionSubjectTeachers.length}{" "}
                  Subjects Assigned
                </span>

              </div>

              {/* =================================================
                  NO SUBJECT TEACHERS
              ================================================= */}

              {sectionSubjectTeachers.length ===
              0 ? (

                <div className="alert alert-warning">
                  No subject teachers have been
                  assigned for this class and
                  section.
                </div>

              ) : (

                <div className="table-responsive">

                  <table className="table table-bordered align-middle mb-0">

                    <thead className="table-light">

                      <tr>

                        <th
                          style={{
                            minWidth: 130,
                          }}
                        >
                          Time
                        </th>

                        {DAYS.map(
                          (day) => (
                            <th
                              key={day}
                              className="text-center"
                              style={{
                                minWidth: 150,
                              }}
                            >
                              {day}
                            </th>
                          )
                        )}

                      </tr>

                    </thead>

                    <tbody>

                      {activeTimeSlots.map(
                        (timeSlot) => (

                          <TimetableRow
                            key={timeSlot._id}
                            timeSlot={
                              timeSlot
                            }
                            days={DAYS}
                            getCell={
                              getCell
                            }
                            editingId={
                              editingId
                            }
                            sectionSubjectTeachers={
                              sectionSubjectTeachers
                            }
                            saving={saving}
                            onCellClick={
                              handleCellClick
                            }
                            onSave={
                              handleSaveCell
                            }
                            onEdit={
                              setEditingId
                            }
                            onDelete={
                              setDeleteTarget
                            }
                          />

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

              {loadingTimetable && (
                <div className="text-center py-4">
                  <div
                    className="spinner-border"
                    role="status"
                  />
                </div>
              )}

            </div>

          </div>

        ) : (

          <div className="card shadow-sm rounded-3">

            <div className="card-body text-center py-5">

              <h6 className="fw-semibold">
                Select Class and Section
              </h6>

              <p className="text-muted small mb-0">
                Select a class and section to
                create the weekly timetable.
              </p>

            </div>

          </div>

        )}

      </div>

      {/* =================================================
          DELETE DIALOG
      ================================================= */}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Timetable Entry"
        message={`Remove ${
          deleteTarget?.subject?.subjectName ||
          "this subject"
        } from ${
          deleteTarget?.day ||
          "this day"
        }?`}
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteTarget(null)
        }
        loading={deleting}
      />

    </MainLayout>
  );
}

// =====================================================
// TIMETABLE ROW
// =====================================================

function TimetableRow({
  timeSlot,
  days,
  getCell,
  editingId,
  sectionSubjectTeachers,
  saving,
  onCellClick,
  onSave,
  onEdit,
  onDelete,
}) {
  return (
    <tr>

      {/* TIME */}

      <td>

        <div className="fw-semibold">
          {timeSlot.periodName}
        </div>

        <small className="text-muted">
          {timeSlot.startTime} -{" "}
          {timeSlot.endTime}
        </small>

        {timeSlot.type !== "Period" && (
          <span className="badge bg-light text-dark ms-1">
            {timeSlot.type}
          </span>
        )}

      </td>

      {/* DAYS */}

      {days.map((day) => {

        const existing =
          getCell(
            day,
            timeSlot._id
          );

        const cellKey = existing
          ? existing._id
          : `new-${day}-${timeSlot._id}`;

        const isEditing =
          editingId === cellKey;

        // Break / Lunch

        if (timeSlot.type !== "Period") {
          return (
            <td
              key={day}
              className="text-center bg-light"
            >
              <small className="text-muted fw-semibold">
                {timeSlot.type}
              </small>
            </td>
          );
        }

        // Existing entry

        if (existing && !isEditing) {

          return (
            <td
              key={day}
              className="p-2"
            >

              <div className="border rounded-3 p-2">

                <div className="fw-semibold small">
                  {
                    existing.subject
                      ?.subjectName
                  }
                </div>

                <div className="text-muted small">
                  {existing.teacher
                    ? `${existing.teacher.firstName || ""} ${
                        existing.teacher.lastName || ""
                      }`
                    : "—"}
                </div>

                {existing.roomNo && (
                  <small className="text-muted">
                    Room: {existing.roomNo}
                  </small>
                )}

                <div className="d-flex gap-1 mt-2">

                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() =>
                      onEdit(
                        existing._id
                      )
                    }
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-light text-danger"
                    onClick={() =>
                      onDelete(existing)
                    }
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </button>

                </div>

              </div>

            </td>
          );
        }

        // Empty / editing cell

        return (
          <td
            key={day}
            className="p-2"
          >

            <TimetableCellForm
              day={day}
              timeSlot={timeSlot}
              existing={existing}
              sectionSubjectTeachers={
                sectionSubjectTeachers
              }
              saving={saving}
              onCancel={() =>
                onEdit(null)
              }
              onSave={onSave}
            />

          </td>
        );
      })}

    </tr>
  );
}

// =====================================================
// CELL FORM
// =====================================================

function TimetableCellForm({
  day,
  timeSlot,
  existing,
  sectionSubjectTeachers,
  saving,
  onCancel,
  onSave,
}) {
  const [subjectTeacher, setSubjectTeacher] =
    useState(
      existing
        ? getSubjectTeacherValue(existing)
        : ""
    );

  const [roomNo, setRoomNo] =
    useState(existing?.roomNo || "");

  const [remarks, setRemarks] =
    useState(existing?.remarks || "");

  const handleSave = () => {
    onSave(
      day,
      timeSlot,
      subjectTeacher,
      roomNo,
      remarks
    );
  };

  return (
    <div>

      <select
        className="form-select form-select-sm mb-2"
        value={subjectTeacher}
        onChange={(e) =>
          setSubjectTeacher(
            e.target.value
          )
        }
        disabled={saving}
      >
        <option value="">
          Select Subject
        </option>

        {sectionSubjectTeachers.map(
          (row) => (
            <option
              key={row._id}
              value={row._id}
            >
              {row.subject?.subjectName ||
                "Subject"}
              {" - "}
              {row.teacher
                ? `${row.teacher.firstName || ""} ${
                    row.teacher.lastName || ""
                  }`
                : "Teacher"}
            </option>
          )
        )}

      </select>

      <input
        type="text"
        className="form-control form-control-sm mb-2"
        placeholder="Room No"
        value={roomNo}
        onChange={(e) =>
          setRoomNo(e.target.value)
        }
        disabled={saving}
      />

      <input
        type="text"
        className="form-control form-control-sm mb-2"
        placeholder="Remarks"
        value={remarks}
        onChange={(e) =>
          setRemarks(e.target.value)
        }
        disabled={saving}
      />

      <div className="d-flex gap-1">

        <button
          type="button"
          className="btn btn-primary btn-sm flex-grow-1"
          onClick={handleSave}
          disabled={
            saving || !subjectTeacher
          }
        >
          <SaveIcon fontSize="small" />
        </button>

        <button
          type="button"
          className="btn btn-light btn-sm"
          onClick={onCancel}
          disabled={saving}
        >
          ×
        </button>

      </div>

    </div>
  );
}

// =====================================================
// HELPER
// =====================================================

function getSubjectTeacherValue(row) {
  if (!row) return "";

  const subject =
    row.subject?._id ||
    row.subject;

  const teacher =
    row.teacher?._id ||
    row.teacher;

  return `${subject}-${teacher}`;
}