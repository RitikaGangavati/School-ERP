import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import { useToast } from "../../context/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import AcademicYearBadge from "../../components/common/AcademicYearBadge";
import { getClasses } from "../../services/classService";
import { getAttendanceForDate, saveAttendance } from "../../services/attendanceService";

const STATUS_OPTIONS = ["Present", "Absent", "Late", "Half Day", "Leave"];
const STATUS_COLORS = {
  Present: "success",
  Absent: "danger",
  Late: "warning",
  "Half Day": "info",
  Leave: "secondary",
};

const todayInput = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const { showToast } = useToast();
  const { currentYear, loading: loadingYear } = useAcademicYear();

  const [allClasses, setAllClasses] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayInput());

  const [students, setStudents] = useState([]);
  const [gridState, setGridState] = useState({});
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const classRes = await getClasses();
        setAllClasses(classRes.data.classes || []);
      } catch (err) {
        setAllClasses([]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const selectedClassObj = allClasses.find((c) => c._id === selectedClass);
  const availableSections = selectedClassObj?.sections || [];

  const handleLoad = async () => {
    if (!currentYear) {
      showToast("No current academic year set. Please set one in Academic Year Master.", "error");
      return;
    }
    if (!selectedClass || !selectedSection || !selectedDate) {
      showToast("Please select class, section, and date", "error");
      return;
    }

    setLoadingGrid(true);
    setHasLoaded(false);
    try {
      const res = await getAttendanceForDate({
        academicYear: currentYear._id,
        class: selectedClass,
        section: selectedSection,
        date: selectedDate,
      });

      setStudents(res.data.students || []);

      const initialState = {};
      (res.data.students || []).forEach((s) => {
        const existing = res.data.attendance?.[s._id];
        initialState[s._id] = {
          status: existing?.status || "Present",
          remarks: existing?.remarks || "",
        };
      });
      setGridState(initialState);
      setHasLoaded(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to load attendance.", "error");
    } finally {
      setLoadingGrid(false);
    }
  };

  const updateStatus = (studentId, status) => {
    setGridState((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const updateRemarks = (studentId, remarks) => {
    setGridState((prev) => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));
  };

  const markAllAs = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = { ...gridState[s._id], status };
    });
    setGridState(updated);
  };

  const handleSave = async () => {
    const records = students.map((s) => ({
      student: s._id,
      status: gridState[s._id]?.status,
      remarks: gridState[s._id]?.remarks || "",
    }));

    setSaving(true);
    try {
      const res = await saveAttendance({
        academicYear: currentYear._id,
        class: selectedClass,
        section: selectedSection,
        date: selectedDate,
        records,
      });
      showToast(res.data.message);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to save attendance.", "error");
    } finally {
      setSaving(false);
    }
  };

  const summary = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = Object.values(gridState).filter((s) => s.status === status).length;
    return acc;
  }, {});

  return (
    <MainLayout>
      <div className="d-flex flex-column gap-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">Attendance</h4>
          <AcademicYearBadge />
        </div>

        <div className="card shadow-sm rounded-3">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-4 mb-3">
                <label className="form-label">Class <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={selectedClass}
                  onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
                  disabled={loadingOptions}
                >
                  <option value="">Select Class</option>
                  {allClasses.map((c) => (
                    <option key={c._id} value={c._id}>{c.className}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Section <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">{selectedClass ? "Select Section" : "Select class first"}</option>
                  {availableSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>{sec.sectionName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label">Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>

              <div className="col-md-1 mb-3">
                <button className="btn btn-primary w-100" onClick={handleLoad} disabled={loadingGrid || loadingYear}>
                  {loadingGrid ? "..." : "Load"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {hasLoaded && (
          <div className="card shadow-sm rounded-3">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div className="d-flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <span key={status} className={`badge bg-${STATUS_COLORS[status]} bg-opacity-75`}>
                      {status}: {summary[status] || 0}
                    </span>
                  ))}
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-success" onClick={() => markAllAs("Present")}>
                    Mark All Present
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => markAllAs("Absent")}>
                    Mark All Absent
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <div className="text-center text-muted py-4">No active students found for this class and section.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Roll No.</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s._id}>
                          <td>{s.academic?.rollNo || "—"}</td>
                          <td>{s.personal?.firstName} {s.personal?.lastName}</td>
                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              {STATUS_OPTIONS.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  className={`btn btn-sm ${
                                    gridState[s._id]?.status === status
                                      ? `btn-${STATUS_COLORS[status]}`
                                      : `btn-outline-${STATUS_COLORS[status]}`
                                  }`}
                                  onClick={() => updateStatus(s._id, status)}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              value={gridState[s._id]?.remarks || ""}
                              onChange={(e) => updateRemarks(s._id, e.target.value)}
                              placeholder="Optional"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-success" onClick={handleSave} disabled={saving || students.length === 0}>
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}