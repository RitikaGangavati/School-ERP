import { useEffect, useMemo, useState, useCallback } from "react";

import MainLayout from "../../components/layout/MainLayout";
import AcademicYearBadge from "../../components/common/AcademicYearBadge";

import { useToast } from "../../context/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

import { getTeachers } from "../../services/teacherService";
import { getTimeSlots } from "../../services/timeSlotService";
import { getTimetables } from "../../services/timetableService";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TeacherTimetable() {
  const { showToast } = useToast();
  const { currentYear } = useAcademicYear();

  // =====================================================
  // STATE
  // =====================================================

  const [teachers, setTeachers] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timetables, setTimetables] = useState([]);

  const [selectedTeacher, setSelectedTeacher] = useState("");

  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  // =====================================================
  // LOAD TEACHERS
  // =====================================================

  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);

    try {
      const res = await getTeachers();

      setTeachers(res.data.teachers || []);
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to load teachers",
        "error"
      );

      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, [showToast]);

  // =====================================================
  // LOAD TIME SLOTS
  // =====================================================

  const fetchTimeSlots = useCallback(async () => {
    try {
      const res = await getTimeSlots();

      const slots = res.data.timeSlots || [];

      // Make sure displayOrder is respected
      slots.sort(
        (a, b) =>
          Number(a.displayOrder) -
          Number(b.displayOrder)
      );

      setTimeSlots(slots);
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to load time slots",
        "error"
      );

      setTimeSlots([]);
    }
  }, [showToast]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchTeachers();
    fetchTimeSlots();
  }, [fetchTeachers, fetchTimeSlots]);

  // =====================================================
  // LOAD TEACHER TIMETABLE
  // =====================================================

  const fetchTeacherTimetable = useCallback(
    async () => {
      if (!currentYear?._id || !selectedTeacher) {
        setTimetables([]);
        return;
      }

      setLoadingTimetable(true);

      try {
        /*
         * We get all timetable records and filter
         * by academic year + teacher.
         *
         * No academic year dropdown is required
         * because AcademicYearContext controls it.
         */

        const res = await getTimetables();

        const rows =
          res.data.timetables || [];

        const filtered = rows.filter((row) => {
          const rowYear =
            row.academicYear?._id ||
            row.academicYear;

          const rowTeacher =
            row.teacher?._id ||
            row.teacher;

          return (
            String(rowYear) ===
              String(currentYear._id) &&
            String(rowTeacher) ===
              String(selectedTeacher)
          );
        });

        setTimetables(filtered);
      } catch (err) {
        showToast(
          err.response?.data?.message ||
            "Failed to load teacher timetable",
          "error"
        );

        setTimetables([]);
      } finally {
        setLoadingTimetable(false);
      }
    },
    [
      currentYear,
      selectedTeacher,
      showToast,
    ]
  );

  useEffect(() => {
    fetchTeacherTimetable();
  }, [fetchTeacherTimetable]);

  // =====================================================
  // SELECTED TEACHER
  // =====================================================

  const selectedTeacherObj = useMemo(() => {
    return teachers.find(
      (teacher) =>
        String(teacher._id) ===
        String(selectedTeacher)
    );
  }, [teachers, selectedTeacher]);

  // =====================================================
  // GET CELL
  // =====================================================

  const getTimetableCell = (
    day,
    timeSlotId
  ) => {
    return timetables.find((row) => {
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
  // RENDER CELL
  // =====================================================

  const renderCell = (row, slot) => {
    /*
     * Break / Lunch
     */

    if (
      slot.type === "Break" ||
      slot.type === "Lunch"
    ) {
      return (
        <div className="text-center py-3">
          <div className="fw-semibold text-muted">
            {slot.periodName}
          </div>

          <small className="text-muted">
            {slot.startTime} - {slot.endTime}
          </small>
        </div>
      );
    }

    /*
     * Empty period
     */

    if (!row) {
      return (
        <div
          className="text-center text-muted py-4"
          style={{
            minHeight: "95px",
          }}
        >
          —
        </div>
      );
    }

    const subjectName =
      row.subject?.subjectName ||
      "Subject";

    const className =
      row.class?.className ||
      "Class";

    const sectionName =
      row.section?.sectionName ||
      "Section";

    return (
      <div
        className="p-3"
        style={{
          minHeight: "95px",
        }}
      >
        <div className="fw-semibold mb-1">
          {subjectName}
        </div>

        <div className="small text-muted">
          {className} - {sectionName}
        </div>

        {row.roomNo && (
          <div className="small text-muted mt-1">
            Room: {row.roomNo}
          </div>
        )}
      </div>
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <MainLayout>
      <div className="container-fluid">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="card shadow-sm rounded-3 mb-4">
          <div className="card-body">

            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">

              <div>
                <div className="d-flex align-items-center gap-2 mb-1">

                  <CalendarMonthOutlinedIcon />

                  <h5 className="fw-bold mb-0">
                    Teacher Timetable
                  </h5>

                </div>

                <p className="text-muted small mb-0">
                  View weekly timetable for a teacher
                </p>
              </div>

              <AcademicYearBadge />

            </div>

          </div>
        </div>

        {/* =================================================
            TEACHER SELECT
        ================================================= */}

        <div className="card shadow-sm rounded-3 mb-4">
          <div className="card-body">

            <div className="row">

              <div className="col-12 col-md-6">

                <label className="form-label fw-semibold">

                  <PersonOutlineOutlinedIcon
                    fontSize="small"
                    className="me-1"
                  />

                  Teacher
                  <span className="text-danger">
                    {" "}*
                  </span>

                </label>

                <select
                  className="form-select"
                  value={selectedTeacher}
                  onChange={(e) =>
                    setSelectedTeacher(
                      e.target.value
                    )
                  }
                  disabled={
                    loadingTeachers ||
                    !currentYear
                  }
                >

                  <option value="">
                    Select Teacher
                  </option>

                  {teachers.map((teacher) => (
                    <option
                      key={teacher._id}
                      value={teacher._id}
                    >
                      {teacher.firstName}{" "}
                      {teacher.lastName}
                      {teacher.employeeId
                        ? ` (${teacher.employeeId})`
                        : ""}
                    </option>
                  ))}

                </select>

              </div>

            </div>

          </div>
        </div>

        {/* =================================================
            NO TEACHER
        ================================================= */}

        {!selectedTeacher && (
          <div className="card shadow-sm rounded-3">
            <div className="card-body text-center py-5">

              <PersonOutlineOutlinedIcon
                sx={{
                  fontSize: 45,
                  opacity: 0.4,
                }}
              />

              <h6 className="fw-semibold mt-3">
                Select a teacher
              </h6>

              <p className="text-muted small mb-0">
                Select a teacher to view their
                weekly timetable.
              </p>

            </div>
          </div>
        )}

        {/* =================================================
            SELECTED TEACHER
        ================================================= */}

        {selectedTeacher && (
          <>
            {/* TEACHER INFO */}

            <div className="card shadow-sm rounded-3 mb-3">
              <div className="card-body py-3">

                <div className="d-flex flex-wrap justify-content-between align-items-center">

                  <div>

                    <div className="fw-bold">
                      {selectedTeacherObj
                        ? `${selectedTeacherObj.firstName} ${selectedTeacherObj.lastName}`
                        : "Teacher"}
                    </div>

                    {selectedTeacherObj?.employeeId && (
                      <small className="text-muted">
                        Employee ID:{" "}
                        {selectedTeacherObj.employeeId}
                      </small>
                    )}

                  </div>

                  <span className="badge bg-primary">
                    Academic Year:{" "}
                    {currentYear?.name}
                  </span>

                </div>

              </div>
            </div>

            {/* =================================================
                TIMETABLE
            ================================================= */}

            <div className="card shadow-sm rounded-3">

              <div className="card-body">

                {loadingTimetable ? (
                  <div className="text-center py-5">

                    <div
                      className="spinner-border text-primary"
                      role="status"
                    />

                    <div className="text-muted small mt-2">
                      Loading timetable...
                    </div>

                  </div>
                ) : (
                  <div
                    className="table-responsive"
                    style={{
                      overflowX: "auto",
                    }}
                  >

                    <table
                      className="table table-bordered align-middle mb-0"
                      style={{
                        minWidth: "1100px",
                      }}
                    >

                      {/* =================================================
                          HEADER
                      ================================================= */}

                      <thead className="table-light">

                        <tr>

                          <th
                            style={{
                              width: "150px",
                              minWidth: "150px",
                            }}
                          >
                            Period
                          </th>

                          {DAYS.map((day) => (
                            <th
                              key={day}
                              className="text-center"
                              style={{
                                minWidth: "175px",
                              }}
                            >
                              {day}
                            </th>
                          ))}

                        </tr>

                      </thead>

                      {/* =================================================
                          BODY
                      ================================================= */}

                      <tbody>

                        {timeSlots.map((slot) => {

                          const isBreak =
                            slot.type ===
                              "Break" ||
                            slot.type ===
                              "Lunch";

                          return (
                            <tr
                              key={slot._id}
                            >

                              {/* PERIOD */}

                              <td
                                className={
                                  isBreak
                                    ? "bg-light"
                                    : ""
                                }
                              >

                                <div className="fw-semibold">
                                  {slot.periodName}
                                </div>

                                <small className="text-muted">
                                  {slot.startTime}{" "}
                                  -{" "}
                                  {slot.endTime}
                                </small>

                              </td>

                              {/* DAYS */}

                              {DAYS.map((day) => {

                                const row =
                                  getTimetableCell(
                                    day,
                                    slot._id
                                  );

                                return (
                                  <td
                                    key={`${day}-${slot._id}`}
                                    className={
                                      isBreak
                                        ? "bg-light"
                                        : ""
                                    }
                                  >
                                    {renderCell(
                                      row,
                                      slot
                                    )}
                                  </td>
                                );
                              })}

                            </tr>
                          );
                        })}

                      </tbody>

                    </table>

                  </div>
                )}

                {/* =================================================
                    EMPTY
                ================================================= */}

                {!loadingTimetable &&
                  selectedTeacher &&
                  timetables.length === 0 && (
                    <div className="text-center py-5">

                      <CalendarMonthOutlinedIcon
                        sx={{
                          fontSize: 45,
                          opacity: 0.4,
                        }}
                      />

                      <h6 className="fw-semibold mt-3">
                        No timetable found
                      </h6>

                      <p className="text-muted small mb-0">
                        No timetable has been
                        assigned to this teacher
                        for the current academic
                        year.
                      </p>

                    </div>
                  )}

              </div>
            </div>
          </>
        )}

      </div>
    </MainLayout>
  );
}