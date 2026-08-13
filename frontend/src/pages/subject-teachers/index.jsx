import { useEffect, useState, useCallback } from "react";

import SaveIcon from "@mui/icons-material/SaveOutlined";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SearchBar from "../../components/common/SearchBar";
import RowActions from "../../components/common/RowActions";

import { useToast } from "../../context/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

import AcademicYearBadge from "../../components/common/AcademicYearBadge";

import { getClasses } from "../../services/classService";
import { getTeachers } from "../../services/teacherService";

import { getSubjectGroups } from "../../services/subjectGroupService";

import {
  getSubjectTeachers,
  createSubjectTeacher,
  updateSubjectTeacher,
  deleteSubjectTeacher,
} from "../../services/subjectTeacherService";

const emptyForm = {
  class: "",
  section: "",
};

export default function SubjectTeacher() {
  const { showToast } = useToast();
  const { currentYear } = useAcademicYear();

  // =========================================================
  // LIST
  // =========================================================

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================
  // OPTIONS
  // =========================================================

  const [allClasses, setAllClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allSubjectGroups, setAllSubjectGroups] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);

  // =========================================================
  // FORM
  // =========================================================

  const [form, setForm] = useState(emptyForm);

  /*
    Example:

    subjectAssignments = [
      {
        subject: "mathId",
        teacher: "emilyId",
        existingId: "assignmentId"
      },
      {
        subject: "englishId",
        teacher: "sharmaId",
        existingId: null
      }
    ]
  */

  const [subjectAssignments, setSubjectAssignments] = useState([]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // =========================================================
  // DELETE
  // =========================================================

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // =========================================================
  // FETCH ASSIGNMENTS
  // =========================================================

  const fetchAssignments = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getSubjectTeachers();

      setAssignments(res.data.subjectTeachers || []);
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to load subject teacher assignments",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // =========================================================
  // FETCH OPTIONS
  // =========================================================

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);

    try {
      const [classRes, teacherRes, subjectGroupRes] =
        await Promise.all([
          getClasses(),
          getTeachers(),
          getSubjectGroups(),
        ]);

      setAllClasses(classRes.data.classes || []);
      setAllTeachers(teacherRes.data.teachers || []);
      setAllSubjectGroups(
        subjectGroupRes.data.subjectGroups || []
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to load form options",
        "error"
      );

      setAllClasses([]);
      setAllTeachers([]);
      setAllSubjectGroups([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [showToast]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchAssignments();
    fetchOptions();
  }, [fetchAssignments, fetchOptions]);

  // =========================================================
  // SELECTED CLASS
  // =========================================================

  const selectedClassObj = allClasses.find(
    (item) => String(item._id) === String(form.class)
  );

  const availableSections =
    selectedClassObj?.sections || [];

  // =========================================================
  // FIND SUBJECT GROUP
  // =========================================================

 const selectedSubjectGroup = allSubjectGroups.find((group) => {
  const groupClassId =
    group.class?._id || group.class;

  const groupAcademicYearId =
    group.academicYear?._id ||
    group.academicYear;

  const groupSections = group.sections || [];

  const sectionExists = groupSections.some((section) => {
    const sectionId =
      section?._id || section;

    return String(sectionId) === String(form.section);
  });

  return (
    String(groupClassId) === String(form.class) &&
    String(groupAcademicYearId) === String(currentYear?._id) &&
    sectionExists
  );
});

  // =========================================================
  // SUBJECTS FROM SUBJECT GROUP
  // =========================================================

  const availableSubjects =
    selectedSubjectGroup?.subjects || [];

  // =========================================================
  // EXISTING ASSIGNMENTS FOR SELECTED SECTION
  // =========================================================

  const getExistingSectionAssignments = (
    sectionId = form.section
  ) => {
    if (!currentYear || !form.class || !sectionId) {
      return [];
    }

    return assignments.filter((row) => {
      const rowYear =
        row.academicYear?._id ||
        row.academicYear;

      const rowClass =
        row.class?._id ||
        row.class;

      const rowSection =
        row.section?._id ||
        row.section;

      return (
        String(rowYear) ===
          String(currentYear._id) &&
        String(rowClass) ===
          String(form.class) &&
        String(rowSection) ===
          String(sectionId)
      );
    });
  };

  // =========================================================
  // GET ELIGIBLE TEACHERS
  // =========================================================

  const getEligibleTeachers = (subjectId) => {
    const teachersForSubject =
      allTeachers.filter((teacher) =>
        teacher.subjects?.some(
          (subject) =>
            String(subject?._id || subject) ===
            String(subjectId)
        )
      );

    /*
      If Teacher Master has subject configuration,
      show only matching teachers.

      If no teachers are configured for that subject,
      show all teachers so assignment is still possible.
    */

    if (teachersForSubject.length > 0) {
      return teachersForSubject;
    }

    return allTeachers;
  };

  // =========================================================
  // CLASS CHANGE
  // =========================================================

  const handleClassChange = (classId) => {
    setForm({
      class: classId,
      section: "",
    });

    setSubjectAssignments([]);
    setErrors({});
  };

  // =========================================================
  // SECTION CHANGE
  // =========================================================

  const handleSectionChange = (sectionId) => {
    setForm((prev) => ({
      ...prev,
      section: sectionId,
    }));

    setErrors({});

    if (!sectionId) {
      setSubjectAssignments([]);
      return;
    }

    /*
      Get assignments already saved for this section.
    */

    const existingRows =
      getExistingSectionAssignments(sectionId);

    /*
      Build one UI row for every subject
      from the Subject Group.
    */

    const rows = availableSubjects.map(
      (subject) => {
        const subjectId =
          subject?._id || subject;

        const existing =
          existingRows.find((row) => {
            const existingSubject =
              row.subject?._id ||
              row.subject;

            return (
              String(existingSubject) ===
              String(subjectId)
            );
          });

        return {
          subject: subjectId,

          teacher:
            existing?.teacher?._id ||
            existing?.teacher ||
            "",

          existingId:
            existing?._id || null,
        };
      }
    );

    setSubjectAssignments(rows);
  };

  // =========================================================
  // TEACHER CHANGE
  // =========================================================

  const handleTeacherChange = (
    subjectId,
    teacherId
  ) => {
    setSubjectAssignments((prev) =>
      prev.map((item) =>
        String(item.subject) ===
        String(subjectId)
          ? {
              ...item,
              teacher: teacherId,
            }
          : item
      )
    );
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validate = () => {
    const newErrors = {};

    if (!form.class) {
      newErrors.class = "Class is required";
    }

    if (!form.section) {
      newErrors.section = "Section is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================================================
  // SAVE ALL ASSIGNMENTS
  // =========================================================

  const handleSubmit = async () => {
    if (!currentYear) {
      showToast(
        "No current academic year is set.",
        "error"
      );
      return;
    }

    if (!validate()) {
      return;
    }

    if (!selectedSubjectGroup) {
      showToast(
        "No subject group is configured for this class.",
        "error"
      );
      return;
    }

    if (availableSubjects.length === 0) {
      showToast(
        "No subjects are configured for this class.",
        "error"
      );
      return;
    }

    setSubmitting(true);

    try {
      /*
        Rows where a teacher is selected.
      */

      const selectedRows =
        subjectAssignments.filter(
          (row) => row.teacher
        );

      /*
        Existing assignments from database.
      */

      const existingRows =
        getExistingSectionAssignments();

      /*
        CREATE / UPDATE
      */

      for (const row of selectedRows) {
        const payload = {
          academicYear: currentYear._id,
          class: form.class,
          section: form.section,
          subject: row.subject,
          teacher: row.teacher,
        };

        if (row.existingId) {
          await updateSubjectTeacher(
            row.existingId,
            payload
          );
        } else {
          await createSubjectTeacher(payload);
        }
      }

      /*
        DELETE assignments that were cleared.
      */

      const selectedExistingIds =
        selectedRows
          .map((row) => row.existingId)
          .filter(Boolean);

      const idsToDelete =
        existingRows
          .map((row) => row._id)
          .filter(
            (id) =>
              !selectedExistingIds.includes(id)
          );

      for (const id of idsToDelete) {
        await deleteSubjectTeacher(id);
      }

      showToast(
        "Subject teacher assignments saved successfully"
      );

      await fetchAssignments();

      /*
        Reload current section.
      */

      const updatedRows =
        getExistingSectionAssignments();

      const rows = availableSubjects.map(
        (subject) => {
          const subjectId =
            subject?._id || subject;

          const existing =
            updatedRows.find((row) => {
              const existingSubject =
                row.subject?._id ||
                row.subject;

              return (
                String(existingSubject) ===
                String(subjectId)
              );
            });

          return {
            subject: subjectId,
            teacher:
              existing?.teacher?._id ||
              existing?.teacher ||
              "",
            existingId:
              existing?._id || null,
          };
        }
      );

      setSubjectAssignments(rows);
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to save assignments",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // CLEAR
  // =========================================================

  const resetForm = () => {
    setForm(emptyForm);
    setSubjectAssignments([]);
    setErrors({});
  };

  // =========================================================
  // DELETE SINGLE ASSIGNMENT
  // =========================================================

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteSubjectTeacher(
        deleteTarget._id
      );

      showToast(
        "Assignment removed successfully"
      );

      setDeleteTarget(null);

      await fetchAssignments();

      /*
        Reload selected section if still selected.
      */

      if (form.section) {
        const existingRows =
          getExistingSectionAssignments();

        const rows =
          availableSubjects.map((subject) => {
            const subjectId =
              subject?._id || subject;

            const existing =
              existingRows.find((row) => {
                const existingSubject =
                  row.subject?._id ||
                  row.subject;

                return (
                  String(existingSubject) ===
                  String(subjectId)
                );
              });

            return {
              subject: subjectId,
              teacher:
                existing?.teacher?._id ||
                existing?.teacher ||
                "",
              existingId:
                existing?._id || null,
            };
          });

        setSubjectAssignments(rows);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Unable to remove assignment",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredRows =
    assignments.filter((row) => {
      const term =
        searchTerm.toLowerCase();

      const teacherName = row.teacher
        ? `${row.teacher.firstName || ""} ${
            row.teacher.lastName || ""
          }`
        : "";

      return (
        teacherName
          .toLowerCase()
          .includes(term) ||
        row.subject?.subjectName
          ?.toLowerCase()
          .includes(term) ||
        row.class?.className
          ?.toLowerCase()
          .includes(term) ||
        row.section?.sectionName
          ?.toLowerCase()
          .includes(term)
      );
    });

  // =========================================================
  // TABLE
  // =========================================================

  const columns = [
    {
      field: "class",
      headerName: "Class",
      render: (row) =>
        row.class?.className || "—",
    },
    {
      field: "section",
      headerName: "Section",
      render: (row) =>
        row.section?.sectionName || "—",
    },
    {
      field: "subject",
      headerName: "Subject",
      render: (row) =>
        row.subject?.subjectName || "—",
    },
    {
      field: "teacher",
      headerName: "Teacher",
      render: (row) =>
        row.teacher
          ? `${row.teacher.firstName || ""} ${
              row.teacher.lastName || ""
            }`
          : "—",
    },
  ];

  // =========================================================
  // UI
  // =========================================================

  return (
    <MainLayout>
      <div className="row g-4">

        {/* =================================================
            LEFT - BULK ASSIGNMENT
        ================================================= */}

        <div className="col-12 col-xl-5">
          <div className="card shadow-sm rounded-3 h-100">
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="fw-bold mb-1">
                    Subject Teacher
                  </h5>

                  <p className="text-muted small mb-0">
                    Assign teachers for a section
                  </p>
                </div>

                <AcademicYearBadge />
              </div>

              {/* =========================================
                  CLASS
              ========================================= */}

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Class{" "}
                  <span className="text-danger">
                    *
                  </span>
                </label>

                <select
                  className={`form-select ${
                    errors.class
                      ? "is-invalid"
                      : ""
                  }`}
                  value={form.class}
                  onChange={(e) =>
                    handleClassChange(
                      e.target.value
                    )
                  }
                  disabled={
                    submitting ||
                    loadingOptions
                  }
                >
                  <option value="">
                    Select Class
                  </option>

                  {allClasses.map((item) => (
                    <option
                      key={item._id}
                      value={item._id}
                    >
                      {item.className}
                    </option>
                  ))}
                </select>

                {errors.class && (
                  <div className="invalid-feedback">
                    {errors.class}
                  </div>
                )}
              </div>

              {/* =========================================
                  SECTION
              ========================================= */}

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Section{" "}
                  <span className="text-danger">
                    *
                  </span>
                </label>

                <select
                  className={`form-select ${
                    errors.section
                      ? "is-invalid"
                      : ""
                  }`}
                  value={form.section}
                  onChange={(e) =>
                    handleSectionChange(
                      e.target.value
                    )
                  }
                  disabled={
                    submitting ||
                    !form.class ||
                    loadingOptions
                  }
                >
                  <option value="">
                    {form.class
                      ? "Select Section"
                      : "Select class first"}
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

                {errors.section && (
                  <div className="invalid-feedback">
                    {errors.section}
                  </div>
                )}
              </div>

              {/* =========================================
                  SUBJECT GROUP INFO
              ========================================= */}

              {form.class && (
                <>
                  {selectedSubjectGroup ? (
                    <div className="alert alert-light border d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <div className="small text-muted">
                          Subject Group
                        </div>

                        <div className="fw-semibold">
                          {
                            selectedSubjectGroup.groupName
                          }
                        </div>
                      </div>

                      <span className="badge bg-primary">
                        {
                          availableSubjects.length
                        }{" "}
                        Subjects
                      </span>
                    </div>
                  ) : (
                    <div className="alert alert-warning small">
                      No subject group found for
                      this class.
                    </div>
                  )}
                </>
              )}

              {/* =========================================
                  SUBJECTS + TEACHERS
              ========================================= */}

              {form.section &&
                selectedSubjectGroup &&
                availableSubjects.length > 0 && (
                  <div>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-semibold mb-0">
                        Subjects & Teachers
                      </label>

                      <small className="text-muted">
                        Select a teacher for each
                        subject
                      </small>
                    </div>

                    <div className="border rounded-3 overflow-hidden">

                      {/* HEADER */}

                      <div className="row g-0 bg-light border-bottom">
                        <div className="col-5 px-3 py-2">
                          <small className="fw-semibold">
                            Subject
                          </small>
                        </div>

                        <div className="col-7 px-3 py-2">
                          <small className="fw-semibold">
                            Teacher
                          </small>
                        </div>
                      </div>

                      {/* ROWS */}

                      {availableSubjects.map(
                        (subject, index) => {
                          const subjectId =
                            subject?._id ||
                            subject;

                          const subjectName =
                            subject?.subjectName ||
                            "Subject";

                          const assignment =
                            subjectAssignments.find(
                              (item) =>
                                String(
                                  item.subject
                                ) ===
                                String(
                                  subjectId
                                )
                            );

                          const teacherValue =
                            assignment?.teacher ||
                            "";

                          const eligibleTeachers =
                            getEligibleTeachers(
                              subjectId
                            );

                          return (
                            <div
                              key={subjectId}
                              className={`row g-0 ${
                                index <
                                availableSubjects.length -
                                  1
                                  ? "border-bottom"
                                  : ""
                              }`}
                            >

                              {/* SUBJECT */}

                              <div className="col-5 px-3 py-3 d-flex align-items-center">
                                <div>
                                  <div className="fw-semibold small">
                                    {
                                      subjectName
                                    }
                                  </div>
                                </div>
                              </div>

                              {/* TEACHER */}

                              <div className="col-7 px-3 py-2">
                                <select
                                  className="form-select form-select-sm"
                                  value={
                                    teacherValue
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    handleTeacherChange(
                                      subjectId,
                                      e
                                        .target
                                        .value
                                    )
                                  }
                                  disabled={
                                    submitting
                                  }
                                >
                                  <option value="">
                                    Select Teacher
                                  </option>

                                  {eligibleTeachers.map(
                                    (
                                      teacher
                                    ) => (
                                      <option
                                        key={
                                          teacher._id
                                        }
                                        value={
                                          teacher._id
                                        }
                                      >
                                        {
                                          teacher.firstName
                                        }{" "}
                                        {
                                          teacher.lastName
                                        }
                                      </option>
                                    )
                                  )}
                                </select>

                                {eligibleTeachers.length ===
                                  0 && (
                                  <small className="text-warning">
                                    No teachers
                                    available
                                  </small>
                                )}
                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* SAVE */}

                    <div className="d-flex gap-2 mt-3">

                      <button
                        type="button"
                        className="btn btn-primary flex-grow-1"
                        onClick={handleSubmit}
                        disabled={
                          submitting ||
                          loadingOptions
                        }
                      >
                        <SaveIcon
                          fontSize="small"
                          className="me-1"
                        />

                        {submitting
                          ? "Saving..."
                          : "Save Assignments"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={resetForm}
                        disabled={
                          submitting
                        }
                      >
                        Clear
                      </button>

                    </div>

                  </div>
                )}

              {/* =========================================
                  NO SUBJECTS
              ========================================= */}

              {form.section &&
                selectedSubjectGroup &&
                availableSubjects.length === 0 && (
                  <div className="alert alert-warning small mb-0">
                    No subjects are configured
                    in this subject group.
                  </div>
                )}

            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT - EXISTING ASSIGNMENTS
        ================================================= */}

        <div className="col-12 col-xl-7">
          <div className="card shadow-sm rounded-3 h-100">

            <div className="card-body">

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">

                <div>
                  <h6 className="fw-bold mb-1">
                    Subject Teacher Assignments
                  </h6>

                  <small className="text-muted">
                    Existing assignments
                  </small>
                </div>

                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search subject, teacher..."
                />

              </div>

              <ResponsiveDataList
                columns={columns}
                rows={filteredRows}
                loading={loading}
                minWidth={650}
                emptyMessage="No subject teacher assignments found."
                renderActions={(row) => (
                  <RowActions
                    onEdit={() => {

                      /*
                        Select the class and section.
                        The existing assignments will
                        automatically be loaded.
                      */

                      const classId =
                        row.class?._id ||
                        row.class ||
                        "";

                      const sectionId =
                        row.section?._id ||
                        row.section ||
                        "";

                      setForm({
                        class: classId,
                        section: "",
                      });

                      setErrors({});

                      /*
                        Set section after class.
                      */

                      setTimeout(() => {
                        handleSectionChange(
                          sectionId
                        );
                      }, 0);
                    }}
                    onDelete={() =>
                      setDeleteTarget(row)
                    }
                  />
                )}
              />

            </div>
          </div>
        </div>

      </div>

      {/* =================================================
          DELETE
      ================================================= */}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Assignment"
        message={`Remove ${
          deleteTarget?.teacher?.firstName ||
          "this teacher"
        } from ${
          deleteTarget?.subject?.subjectName ||
          "this subject"
        }?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() =>
          setDeleteTarget(null)
        }
        loading={deleting}
      />
    </MainLayout>
  );
}