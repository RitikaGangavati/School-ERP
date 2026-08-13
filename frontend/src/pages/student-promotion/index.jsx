import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";
import { useToast } from "../../context/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

import { getAcademicYears } from "../../services/academicYearService";
import { getClasses } from "../../services/classService";
import { getStudentsForPromotion, promoteStudents } from "../../services/studentPromotionService";

export default function StudentPromotion() {
  const { showToast } = useToast();
   const { currentYear: activeYear } = useAcademicYear();

  const [allYears, setAllYears] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [currentYear, setCurrentYear] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [currentSection, setCurrentSection] = useState("");

  const [promoteYear, setPromoteYear] = useState("");
  const [promoteClass, setPromoteClass] = useState("");
  const [promoteSection, setPromoteSection] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [yearRes, classRes] = await Promise.all([getAcademicYears(), getClasses()]);
        setAllYears(yearRes.data.academicYears || []);
        setAllClasses(classRes.data.classes || []);
      } catch (err) {
        setAllYears([]);
        setAllClasses([]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const currentClassObj = allClasses.find((c) => c._id === currentClass);
  const currentSections = currentClassObj?.sections || [];

  const promoteClassObj = allClasses.find((c) => c._id === promoteClass);
  const promoteSections = promoteClassObj?.sections || [];

  const handleLoadStudents = async () => {
    if (!currentYear || !currentClass || !currentSection) {
      showToast("Please select current academic year, class, and section", "error");
      return;
    }

    setLoadingStudents(true);
    setHasLoaded(false);
    try {
      const res = await getStudentsForPromotion({
        academicYear: currentYear,
        class: currentClass,
        section: currentSection,
      });
      setStudents(res.data.students || []);
      setSelectedIds(res.data.students.map((s) => s._id));
      setHasLoaded(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to load students.", "error");
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleStudent = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.length === students.length ? [] : students.map((s) => s._id));
  };

  const handlePromote = async () => {
    if (!promoteYear || !promoteClass || !promoteSection) {
      showToast("Please select the year, class, and section to promote to", "error");
      return;
    }
    if (selectedIds.length === 0) {
      showToast("Select at least one student to promote", "error");
      return;
    }

    setPromoting(true);
    try {
      const res = await promoteStudents({
        studentIds: selectedIds,
        fromAcademicYear: currentYear,
        fromClass: currentClass,
        fromSection: currentSection,
        promoteToAcademicYear: promoteYear,
        promoteToClass: promoteClass,
        promoteToSection: promoteSection,
      });
      showToast(res.data.message);
      setStudents([]);
      setSelectedIds([]);
      setHasLoaded(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Unable to promote students.", "error");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <MainLayout>
      <div className="d-flex flex-column gap-3">
        <h4 className="fw-bold mb-0">🎓 Student Promotion</h4>

        <div className="card shadow-sm rounded-3">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Current Details</h6>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Current Academic Year <span className="text-danger">*</span></label>
                <select className="form-select" value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} disabled={loadingOptions}>
                  <option value="">Select Year</option>
                  {allYears.map((y) => (
                    <option key={y._id} value={y._id}>{y.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Current Class <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={currentClass}
                  onChange={(e) => { setCurrentClass(e.target.value); setCurrentSection(""); }}
                  disabled={loadingOptions}
                >
                  <option value="">Select Class</option>
                  {allClasses.map((c) => (
                    <option key={c._id} value={c._id}>{c.className}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Current Section <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={currentSection}
                  onChange={(e) => setCurrentSection(e.target.value)}
                  disabled={!currentClass}
                >
                  <option value="">{currentClass ? "Select Section" : "Select class first"}</option>
                  {currentSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>{sec.sectionName}</option>
                  ))}
                </select>
              </div>
            </div>

            <hr />

            <h6 className="fw-bold mb-3">Promote To</h6>
            <div className="row align-items-end">
              <div className="col-md-3 mb-3">
                <label className="form-label">Promote To Academic Year <span className="text-danger">*</span></label>
                <select className="form-select" value={promoteYear} onChange={(e) => setPromoteYear(e.target.value)} disabled={loadingOptions}>
                  <option value="">Select Year</option>
                  {allYears.map((y) => (
                    <option key={y._id} value={y._id}>{y.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Promote To Class <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={promoteClass}
                  onChange={(e) => { setPromoteClass(e.target.value); setPromoteSection(""); }}
                  disabled={loadingOptions}
                >
                  <option value="">Select Class</option>
                  {allClasses.map((c) => (
                    <option key={c._id} value={c._id}>{c.className}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Promote To Section <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={promoteSection}
                  onChange={(e) => setPromoteSection(e.target.value)}
                  disabled={!promoteClass}
                >
                  <option value="">{promoteClass ? "Select Section" : "Select class first"}</option>
                  {promoteSections.map((sec) => (
                    <option key={sec._id} value={sec._id}>{sec.sectionName}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <button className="btn btn-primary w-100" onClick={handleLoadStudents} disabled={loadingStudents}>
                  {loadingStudents ? "Loading..." : "Load Students"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {hasLoaded && (
          <div className="card shadow-sm rounded-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Student List</h6>
                <div className="text-muted small">
                  Total Students: <strong>{students.length}</strong> &nbsp;|&nbsp;
                  Selected: <strong>{selectedIds.length}</strong>
                </div>
              </div>

              {students.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No active students found for this class and section.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 40 }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.length === students.length}
                            onChange={toggleAll}
                          />
                        </th>
                        <th>Roll No.</th>
                        <th>Admission No.</th>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s._id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.includes(s._id)}
                              onChange={() => toggleStudent(s._id)}
                            />
                          </td>
                          <td>{s.academic?.rollNo || "—"}</td>
                          <td>{s.academic?.admissionNumber}</td>
                          <td>{s.personal?.firstName} {s.personal?.lastName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="btn btn-outline-secondary" onClick={() => { setStudents([]); setHasLoaded(false); }} disabled={promoting}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handlePromote} disabled={promoting || selectedIds.length === 0}>
                  {promoting ? "Promoting..." : "Promote Students"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}