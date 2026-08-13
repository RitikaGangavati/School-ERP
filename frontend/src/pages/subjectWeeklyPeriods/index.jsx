import { useEffect, useState, useCallback, useMemo } from "react";

import SaveIcon from "@mui/icons-material/SaveOutlined";

import MainLayout from "../../components/layout/MainLayout";
import SearchBar from "../../components/common/SearchBar";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RowActions from "../../components/common/RowActions";

import { useToast } from "../../context/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

import AcademicYearBadge from "../../components/common/AcademicYearBadge";

import { getClasses } from "../../services/classService";
import { getSubjectGroups } from "../../services/subjectGroupService";

import {
  getSubjectWeeklyPeriods,
  getSubjectWeeklyPeriodsBySection,
  createSubjectWeeklyPeriod,
  updateSubjectWeeklyPeriod,
  deleteSubjectWeeklyPeriod,
} from "../../services/subjectWeeklyPeriodService";


// =========================================================
// EMPTY FORM
// =========================================================

const emptyForm = {
  class: "",
  section: "",
};


// =========================================================
// COMPONENT
// =========================================================

export default function SubjectWeeklyPeriods() {
  const { showToast } = useToast();
  const { currentYear } = useAcademicYear();


  // =======================================================
  // LIST
  // =======================================================

  const [weeklyPeriods, setWeeklyPeriods] = useState([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");


  // =======================================================
  // OPTIONS
  // =======================================================

  const [allClasses, setAllClasses] = useState([]);

  const [allSubjectGroups, setAllSubjectGroups] = useState([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);


  // =======================================================
  // FORM
  // =======================================================

  const [form, setForm] = useState(emptyForm);

  const [subjectAssignments, setSubjectAssignments] =
    useState([]);

  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] =
    useState(false);


  // =======================================================
  // DELETE
  // =======================================================

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);


  // =======================================================
  // FETCH ALL WEEKLY PERIODS
  // =======================================================

  const fetchWeeklyPeriods = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getSubjectWeeklyPeriods();

      setWeeklyPeriods(
        res.data.subjectWeeklyPeriods || []
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to load weekly periods",
        "error"
      );

      setWeeklyPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);


  // =======================================================
  // FETCH OPTIONS
  // =======================================================

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);

    try {
      const [
        classRes,
        subjectGroupRes,
      ] = await Promise.all([
        getClasses(),
        getSubjectGroups(),
      ]);

      setAllClasses(
        classRes.data.classes || []
      );

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
      setAllSubjectGroups([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [showToast]);


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    fetchWeeklyPeriods();
    fetchOptions();
  }, [
    fetchWeeklyPeriods,
    fetchOptions,
  ]);


  // =======================================================
  // SELECTED CLASS
  // =======================================================

  const selectedClassObj = useMemo(() => {
    return allClasses.find(
      (item) =>
        String(item._id) ===
        String(form.class)
    );
  }, [allClasses, form.class]);


  // =======================================================
  // AVAILABLE SECTIONS
  // =======================================================

  const availableSections =
    selectedClassObj?.sections || [];


  // =======================================================
  // SELECTED SUBJECT GROUP
  // =======================================================

  const selectedSubjectGroup = useMemo(() => {
    if (
      !form.class ||
      !form.section ||
      !currentYear?._id
    ) {
      return null;
    }

    return allSubjectGroups.find((group) => {
      const groupClassId =
        group.class?._id ||
        group.class;

      const groupAcademicYearId =
        group.academicYear?._id ||
        group.academicYear;

      const groupSections =
        group.sections || [];

      const sectionExists =
        groupSections.some((section) => {
          const sectionId =
            section?._id ||
            section;

          return (
            String(sectionId) ===
            String(form.section)
          );
        });

      return (
        String(groupClassId) ===
          String(form.class) &&
        String(groupAcademicYearId) ===
          String(currentYear._id) &&
        sectionExists
      );
    });
  }, [
    allSubjectGroups,
    form.class,
    form.section,
    currentYear,
  ]);


  // =======================================================
  // AVAILABLE SUBJECTS
  // =======================================================

  const availableSubjects = useMemo(() => {
    const subjects =
      selectedSubjectGroup?.subjects || [];

    /*
      Subjects should ideally already be populated:

      {
        _id: "...",
        subjectName: "Maths"
      }
    */

    return subjects
      .map((subject) => {
        if (
          subject &&
          typeof subject === "object" &&
          subject._id
        ) {
          return subject;
        }

        return null;
      })
      .filter(Boolean);
  }, [selectedSubjectGroup]);


  // =======================================================
  // DEBUG
  // =======================================================

  /*
    Uncomment if subjects are still not showing.

    console.log(
      "ALL SUBJECT GROUPS:",
      allSubjectGroups
    );

    console.log(
      "SELECTED SUBJECT GROUP:",
      selectedSubjectGroup
    );

    console.log(
      "AVAILABLE SUBJECTS:",
      availableSubjects
    );
  */


  // =======================================================
  // LOAD WEEKLY PERIODS FOR SECTION
  // =======================================================

  const loadSectionWeeklyPeriods = useCallback(
    async (
      classId,
      sectionId,
      subjects = availableSubjects
    ) => {
      if (
        !currentYear?._id ||
        !classId ||
        !sectionId
      ) {
        setSubjectAssignments([]);
        return;
      }

      try {
        const res =
          await getSubjectWeeklyPeriodsBySection(
            currentYear._id,
            classId,
            sectionId
          );

        const existingRows =
          res.data.subjectWeeklyPeriods || [];

        /*
          Create one UI row for every
          subject from Subject Group.
        */

        const rows = subjects.map(
          (subject) => {
            const subjectId =
              subject?._id;

            const existing =
              existingRows.find(
                (row) => {
                  const existingSubject =
                    row.subject?._id ||
                    row.subject;

                  return (
                    String(existingSubject) ===
                    String(subjectId)
                  );
                }
              );

            return {
              subject: subjectId,

              subjectName:
                subject.subjectName ||
                "Subject",

              periodsPerWeek:
                existing?.periodsPerWeek ??
                "",

              existingId:
                existing?._id ||
                null,

              active:
                existing?.active ??
                true,
            };
          }
        );

        setSubjectAssignments(rows);
      } catch (err) {
        showToast(
          err.response?.data?.message ||
            "Failed to load weekly periods",
          "error"
        );

        setSubjectAssignments([]);
      }
    },
    [
      currentYear,
      availableSubjects,
      showToast,
    ]
  );


  // =======================================================
  // CLASS CHANGE
  // =======================================================

  const handleClassChange = (classId) => {
    setForm({
      class: classId,
      section: "",
    });

    setSubjectAssignments([]);

    setErrors({});
  };


  // =======================================================
  // SECTION CHANGE
  // =======================================================

  const handleSectionChange = async (
    sectionId
  ) => {
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
      We cannot immediately use availableSubjects
      here because selectedSubjectGroup depends
      on the new section state.

      Find the group directly using classId
      + sectionId.
    */

    const group =
      allSubjectGroups.find((item) => {
        const groupClassId =
          item.class?._id ||
          item.class;

        const groupYearId =
          item.academicYear?._id ||
          item.academicYear;

        const sectionExists =
          (item.sections || []).some(
            (section) => {
              const sectionIdValue =
                section?._id ||
                section;

              return (
                String(sectionIdValue) ===
                String(sectionId)
              );
            }
          );

        return (
          String(groupClassId) ===
            String(form.class) &&
          String(groupYearId) ===
            String(currentYear?._id) &&
          sectionExists
        );
      });

    if (!group) {
      setSubjectAssignments([]);
      return;
    }

    /*
      Only use populated subjects.
    */

    const subjects =
      (group.subjects || [])
        .filter(
          (subject) =>
            subject &&
            typeof subject === "object" &&
            subject._id
        );

    await loadSectionWeeklyPeriods(
      form.class,
      sectionId,
      subjects
    );
  };


  // =======================================================
  // PERIOD CHANGE
  // =======================================================

  const handlePeriodChange = (
    subjectId,
    value
  ) => {
    /*
      Allow empty value while typing.
    */

    if (value === "") {
      setSubjectAssignments((prev) =>
        prev.map((item) =>
          String(item.subject) ===
          String(subjectId)
            ? {
                ...item,
                periodsPerWeek: "",
              }
            : item
        )
      );

      return;
    }

    const numberValue =
      Number(value);

    /*
      Do not allow negative numbers.
    */

    if (
      Number.isNaN(numberValue) ||
      numberValue < 0
    ) {
      return;
    }

    setSubjectAssignments((prev) =>
      prev.map((item) =>
        String(item.subject) ===
        String(subjectId)
          ? {
              ...item,
              periodsPerWeek:
                numberValue,
            }
          : item
      )
    );
  };


  // =======================================================
  // VALIDATION
  // =======================================================

  const validate = () => {
    const newErrors = {};

    if (!form.class) {
      newErrors.class =
        "Class is required";
    }

    if (!form.section) {
      newErrors.section =
        "Section is required";
    }

    subjectAssignments.forEach(
      (item) => {
        if (
          item.periodsPerWeek !== "" &&
          (
            !Number.isInteger(
              Number(
                item.periodsPerWeek
              )
            ) ||
            Number(
              item.periodsPerWeek
            ) < 1
          )
        ) {
          newErrors[
            item.subject
          ] =
            "Enter a whole number greater than 0";
        }
      }
    );

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };


  // =======================================================
  // SAVE
  // =======================================================

  const handleSubmit = async () => {
    if (!currentYear?._id) {
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
        "No subject group found for this class and section.",
        "error"
      );

      return;
    }

    if (
      availableSubjects.length === 0
    ) {
      showToast(
        "No subjects found in this subject group.",
        "error"
      );

      return;
    }

    /*
      Only save rows that have
      a period value.
    */

    const rowsToSave =
      subjectAssignments.filter(
        (row) =>
          row.periodsPerWeek !== "" &&
          row.periodsPerWeek !== null &&
          row.periodsPerWeek !== undefined
      );

    if (
      rowsToSave.length === 0
    ) {
      showToast(
        "Please enter periods for at least one subject.",
        "error"
      );

      return;
    }

    setSubmitting(true);

    try {
      for (
        const row of rowsToSave
      ) {
        const payload = {
          academicYear:
            currentYear._id,

          class:
            form.class,

          section:
            form.section,

          subject:
            row.subject,

          periodsPerWeek:
            Number(
              row.periodsPerWeek
            ),
        };

        if (row.existingId) {
          await updateSubjectWeeklyPeriod(
            row.existingId,
            payload
          );
        } else {
          await createSubjectWeeklyPeriod(
            payload
          );
        }
      }

      showToast(
        "Weekly periods saved successfully"
      );

      await fetchWeeklyPeriods();

      await loadSectionWeeklyPeriods(
        form.class,
        form.section,
        availableSubjects
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Failed to save weekly periods",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };


  // =======================================================
  // CLEAR
  // =======================================================

  const resetForm = () => {
    setForm(emptyForm);

    setSubjectAssignments([]);

    setErrors({});
  };


  // =======================================================
  // DELETE
  // =======================================================

  const handleDeleteConfirm =
    async () => {
      if (!deleteTarget) {
        return;
      }

      setDeleting(true);

      try {
        await deleteSubjectWeeklyPeriod(
          deleteTarget._id
        );

        showToast(
          "Weekly period removed successfully"
        );

        setDeleteTarget(null);

        await fetchWeeklyPeriods();

        if (
          form.class &&
          form.section
        ) {
          await loadSectionWeeklyPeriods(
            form.class,
            form.section,
            availableSubjects
          );
        }
      } catch (err) {
        showToast(
          err.response?.data?.message ||
            "Unable to remove weekly period",
          "error"
        );
      } finally {
        setDeleting(false);
      }
    };


  // =======================================================
  // SEARCH
  // =======================================================

  const filteredRows =
    weeklyPeriods.filter(
      (row) => {
        const term =
          searchTerm
            .toLowerCase()
            .trim();

        const subjectName =
          row.subject
            ?.subjectName ||
          "";

        const className =
          row.class
            ?.className ||
          "";

        const sectionName =
          row.section
            ?.sectionName ||
          "";

        return (
          subjectName
            .toLowerCase()
            .includes(term) ||
          className
            .toLowerCase()
            .includes(term) ||
          sectionName
            .toLowerCase()
            .includes(term)
        );
      }
    );


  // =======================================================
  // TABLE COLUMNS
  // =======================================================

  const columns = [
    {
      field: "class",
      headerName: "Class",

      render: (row) =>
        row.class?.className ||
        "—",
    },

    {
      field: "section",
      headerName: "Section",

      render: (row) =>
        row.section?.sectionName ||
        "—",
    },

    {
      field: "subject",
      headerName: "Subject",

      render: (row) =>
        row.subject?.subjectName ||
        "—",
    },

    {
      field: "periodsPerWeek",
      headerName: "Periods / Week",

      render: (row) => (
        <span className="badge bg-primary">
          {row.periodsPerWeek}
        </span>
      ),
    },
  ];


  // =======================================================
  // UI
  // =======================================================

  return (
    <MainLayout>

      <div className="container-fluid">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">

          <div>
            <h4 className="fw-bold mb-1">
              Subject Weekly Periods
            </h4>

            <p className="text-muted mb-0">
              Set how many periods each subject
              should have per week.
            </p>
          </div>

          <AcademicYearBadge />

        </div>


        <div className="row g-4">


          {/* =================================================
              LEFT - SELECTION
          ================================================= */}

          <div className="col-12 col-xl-5">

            <div className="card shadow-sm rounded-3 h-100">

              <div className="card-body">

                <div className="mb-4">

                  <h5 className="fw-bold mb-1">
                    Select Class & Section
                  </h5>

                  <p className="text-muted small mb-0">
                    Subjects are automatically
                    loaded from the Subject Group.
                  </p>

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
                      loadingOptions ||
                      submitting
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
                      !form.class ||
                      loadingOptions ||
                      submitting
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
                    SUBJECT GROUP
                ========================================= */}

                {form.class &&
                  form.section && (
                    <>
                      {selectedSubjectGroup ? (

                        <div className="alert alert-light border mb-4">

                          <div className="d-flex justify-content-between align-items-center">

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

                        </div>

                      ) : (

                        <div className="alert alert-warning small">
                          No subject group found
                          for this class and
                          section.
                        </div>

                      )}
                    </>
                  )}

              </div>

            </div>

          </div>


          {/* =================================================
              RIGHT - WEEKLY PERIOD PLAN
          ================================================= */}

          <div className="col-12 col-xl-7">

            <div className="card shadow-sm rounded-3">

              <div className="card-body">

                <div className="mb-3">

                  <h5 className="fw-bold mb-1">
                    Weekly Period Plan
                  </h5>

                  <p className="text-muted small mb-0">
                    Set the required number
                    of periods for each subject.
                  </p>

                </div>


                {/* =========================================
                    NO SECTION
                ========================================= */}

                {!form.section && (

                  <div className="text-center py-5">

                    <div className="text-muted">
                      Select a class and
                      section to configure
                      weekly periods.
                    </div>

                  </div>

                )}


                {/* =========================================
                    NO SUBJECT GROUP
                ========================================= */}

                {form.section &&
                  !selectedSubjectGroup && (

                    <div className="alert alert-warning">
                      No subject group is
                      configured for this
                      section.
                    </div>

                  )}


                {/* =========================================
                    NO SUBJECTS
                ========================================= */}

                {form.section &&
                  selectedSubjectGroup &&
                  availableSubjects.length ===
                    0 && (

                    <div className="alert alert-warning">
                      No subjects found in
                      this subject group.
                    </div>

                  )}


                {/* =========================================
                    SUBJECT TABLE
                ========================================= */}

                {form.section &&
                  selectedSubjectGroup &&
                  availableSubjects.length >
                    0 && (

                    <>

                      <div className="border rounded-3 overflow-hidden">

                        {/* HEADER */}

                        <div className="row g-0 bg-light border-bottom">

                          <div className="col-8 px-3 py-2">
                            <small className="fw-semibold">
                              Subject
                            </small>
                          </div>

                          <div className="col-4 px-3 py-2">
                            <small className="fw-semibold">
                              Periods / Week
                            </small>
                          </div>

                        </div>


                        {/* ROWS */}

                        {subjectAssignments.map(
                          (
                            item,
                            index
                          ) => (

                            <div
                              key={
                                item.subject
                              }
                              className={`row g-0 ${
                                index <
                                subjectAssignments.length -
                                  1
                                  ? "border-bottom"
                                  : ""
                              }`}
                            >

                              {/* SUBJECT */}

                              <div className="col-8 px-3 py-3 d-flex align-items-center">

                                <div>

                                  <div className="fw-semibold">
                                    {
                                      item.subjectName
                                    }
                                  </div>

                                  {item.existingId && (
                                    <small className="text-success">
                                      Already
                                      configured
                                    </small>
                                  )}

                                </div>

                              </div>


                              {/* PERIOD */}

                              <div className="col-4 px-3 py-2">

                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  className={`form-control ${
                                    errors[
                                      item.subject
                                    ]
                                      ? "is-invalid"
                                      : ""
                                  }`}
                                  value={
                                    item.periodsPerWeek
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    handlePeriodChange(
                                      item.subject,
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. 5"
                                  disabled={
                                    submitting
                                  }
                                />

                                {errors[
                                  item.subject
                                ] && (

                                  <div className="invalid-feedback">

                                    {
                                      errors[
                                        item.subject
                                      ]
                                    }

                                  </div>

                                )}

                              </div>

                            </div>

                          )
                        )}

                      </div>


                      {/* =====================================
                          SAVE
                      ===================================== */}

                      <div className="d-flex gap-2 mt-3">

                        <button
                          type="button"
                          className="btn btn-primary flex-grow-1"
                          onClick={
                            handleSubmit
                          }
                          disabled={
                            submitting
                          }
                        >

                          <SaveIcon
                            fontSize="small"
                            className="me-1"
                          />

                          {submitting
                            ? "Saving..."
                            : "Save Weekly Periods"}

                        </button>


                        <button
                          type="button"
                          className="btn btn-light"
                          onClick={
                            resetForm
                          }
                          disabled={
                            submitting
                          }
                        >
                          Clear
                        </button>

                      </div>

                    </>

                  )}

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            EXISTING RECORDS
        ================================================= */}

        <div className="card shadow-sm rounded-3 mt-4">

          <div className="card-body">

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">

              <div>

                <h5 className="fw-bold mb-1">
                  Weekly Period Settings
                </h5>

                <small className="text-muted">
                  Existing subject weekly
                  period configurations.
                </small>

              </div>


              <SearchBar
                value={searchTerm}
                onChange={
                  setSearchTerm
                }
                placeholder="Search subject, class..."
              />

            </div>


            <ResponsiveDataList
              columns={columns}
              rows={filteredRows}
              loading={loading}
              minWidth={650}
              emptyMessage="No weekly period settings found."

              renderActions={(row) => (

                <RowActions

                  onEdit={() => {

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
                      section: sectionId,
                    });

                    setErrors({});

                    /*
                      Find the Subject Group
                      for this class + section.
                    */

                    const group =
                      allSubjectGroups.find(
                        (item) => {

                          const groupClassId =
                            item.class?._id ||
                            item.class;

                          const groupYearId =
                            item.academicYear?._id ||
                            item.academicYear;

                          const sectionExists =
                            (
                              item.sections ||
                              []
                            ).some(
                              (section) => {

                                const sectionIdValue =
                                  section?._id ||
                                  section;

                                return (
                                  String(
                                    sectionIdValue
                                  ) ===
                                  String(
                                    sectionId
                                  )
                                );
                              }
                            );

                          return (
                            String(
                              groupClassId
                            ) ===
                              String(
                                classId
                              ) &&
                            String(
                              groupYearId
                            ) ===
                              String(
                                currentYear?._id
                              ) &&
                            sectionExists
                          );
                        }
                      );

                    const subjects =
                      (
                        group?.subjects ||
                        []
                      ).filter(
                        (subject) =>
                          subject &&
                          typeof subject ===
                            "object" &&
                          subject._id
                      );

                    loadSectionWeeklyPeriods(
                      classId,
                      sectionId,
                      subjects
                    );

                  }}


                  onDelete={() =>
                    setDeleteTarget(
                      row
                    )
                  }

                />

              )}

            />

          </div>

        </div>

      </div>


      {/* =================================================
          DELETE DIALOG
      ================================================= */}

      <ConfirmDialog

        open={
          !!deleteTarget
        }

        title="Remove Weekly Period"

        message={`Remove ${
          deleteTarget
            ?.subject
            ?.subjectName ||
          "this subject"
        } weekly period setting?`}

        onConfirm={
          handleDeleteConfirm
        }

        onCancel={() =>
          setDeleteTarget(null)
        }

        loading={deleting}

      />

    </MainLayout>
  );
}