import { useEffect, useState, useCallback } from "react";

import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import MainLayout from "../../components/layout/MainLayout";
import ResponsiveDataList from "../../components/common/ResponsiveDataList";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusChip from "../../components/common/StatusChip";
import SearchBar from "../../components/common/SearchBar";
import PillList from "../../components/common/PillList";
import RowActions from "../../components/common/RowActions";
import AcademicYearBadge from "../../components/common/AcademicYearBadge";

import { useToast } from "../../context/ToastContext";
import { useAcademicYear } from "../../context/AcademicYearContext";

import { getClasses } from "../../services/classService";
import { getSubjects } from "../../services/subjectService";

import {
  getSubjectGroups,
  createSubjectGroup,
  updateSubjectGroup,
  deleteSubjectGroup,
} from "../../services/subjectGroupService";


const emptyForm = {
  groupName: "",
  class: "",
  sections: [],
  subjects: [],
  description: "",
  active: true,
};


export default function SubjectGroupList() {
  const { showToast } = useToast();
  const { currentYear } = useAcademicYear();

  // -----------------------------------------
  // LIST STATE
  // -----------------------------------------

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // -----------------------------------------
  // OPTIONS
  // -----------------------------------------

  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // -----------------------------------------
  // FORM
  // -----------------------------------------

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [formErrors, setFormErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  // -----------------------------------------
  // DELETE
  // -----------------------------------------

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);


  // =========================================================
  // FETCH SUBJECT GROUPS
  // =========================================================

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getSubjectGroups();

      setGroups(res.data.subjectGroups || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load subject groups. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);


  // =========================================================
  // FETCH CLASSES + SUBJECTS
  // =========================================================

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);

    try {
      const [classRes, subjectRes] = await Promise.all([
        getClasses(),
        getSubjects(),
      ]);

      setAllClasses(classRes.data.classes || []);
      setAllSubjects(subjectRes.data.subjects || []);
    } catch (err) {
      console.error("Unable to load options:", err);

      setAllClasses([]);
      setAllSubjects([]);

      showToast(
        "Unable to load classes or subjects.",
        "error"
      );
    } finally {
      setLoadingOptions(false);
    }
  }, [showToast]);


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchGroups();
    fetchOptions();
  }, [fetchGroups, fetchOptions]);


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredGroups = groups.filter((group) => {
    const search = searchTerm.toLowerCase();

    return (
      group.groupName?.toLowerCase().includes(search) ||
      group.class?.className?.toLowerCase().includes(search) ||
      group.academicYear?.name?.toLowerCase().includes(search)
    );
  });


  // =========================================================
  // SELECTED CLASS
  // =========================================================

  const selectedClassObj = allClasses.find(
    (item) => item._id === form.class
  );

  const availableSections = selectedClassObj?.sections || [];


  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormErrors({});
  };


  // =========================================================
  // EDIT
  // =========================================================

  const handleEditClick = (row) => {
    setForm({
      groupName: row.groupName || "",

      class: row.class?._id || row.class || "",

      sections:
        row.sections?.map((section) => section._id || section) || [],

      subjects:
        row.subjects?.map((subject) => subject._id || subject) || [],

      description: row.description || "",

      active: row.active ?? true,
    });

    setEditingId(row._id);

    setFormErrors({});

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // =========================================================
  // CLASS CHANGE
  // =========================================================

  const handleClassChange = (classId) => {
    setForm((prev) => ({
      ...prev,
      class: classId,
      sections: [],
    }));

    setFormErrors((prev) => ({
      ...prev,
      class: "",
      sections: "",
    }));
  };


  // =========================================================
  // TOGGLE SECTION
  // =========================================================

  const toggleSection = (sectionId) => {
    setForm((prev) => {
      const alreadySelected =
        prev.sections.includes(sectionId);

      return {
        ...prev,

        sections: alreadySelected
          ? prev.sections.filter(
              (id) => id !== sectionId
            )
          : [...prev.sections, sectionId],
      };
    });

    setFormErrors((prev) => ({
      ...prev,
      sections: "",
    }));
  };


  // =========================================================
  // SELECT ALL SECTIONS
  // =========================================================

  const selectAllSections = () => {
    setForm((prev) => ({
      ...prev,
      sections: availableSections.map(
        (section) => section._id
      ),
    }));

    setFormErrors((prev) => ({
      ...prev,
      sections: "",
    }));
  };


  // =========================================================
  // CLEAR ALL SECTIONS
  // =========================================================

  const clearAllSections = () => {
    setForm((prev) => ({
      ...prev,
      sections: [],
    }));
  };


  // =========================================================
  // TOGGLE SUBJECT
  // =========================================================

  const toggleSubject = (subjectId) => {
    setForm((prev) => {
      const alreadySelected =
        prev.subjects.includes(subjectId);

      return {
        ...prev,

        subjects: alreadySelected
          ? prev.subjects.filter(
              (id) => id !== subjectId
            )
          : [...prev.subjects, subjectId],
      };
    });

    setFormErrors((prev) => ({
      ...prev,
      subjects: "",
    }));
  };


  // =========================================================
  // SELECT ALL SUBJECTS
  // =========================================================

  const selectAllSubjects = () => {
    setForm((prev) => ({
      ...prev,
      subjects: allSubjects.map(
        (subject) => subject._id
      ),
    }));

    setFormErrors((prev) => ({
      ...prev,
      subjects: "",
    }));
  };


  // =========================================================
  // CLEAR ALL SUBJECTS
  // =========================================================

  const clearAllSubjects = () => {
    setForm((prev) => ({
      ...prev,
      subjects: [],
    }));
  };


  // =========================================================
  // VALIDATION
  // =========================================================

  const validate = () => {
    const errors = {};

    if (!form.groupName.trim()) {
      errors.groupName = "Group name is required";
    }

    if (!form.class) {
      errors.class = "Class is required";
    }

    if (form.sections.length === 0) {
      errors.sections =
        "Select at least one section";
    }

    if (form.subjects.length === 0) {
      errors.subjects =
        "Select at least one subject";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };


  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentYear) {
      showToast(
        "No current academic year set. Set one in Academic Year master first.",
        "error"
      );

      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,

        academicYear: currentYear._id,

        sections: form.sections,

        subjects: form.subjects,
      };

      if (editingId) {
        await updateSubjectGroup(
          editingId,
          payload
        );

        showToast(
          "Subject group updated successfully"
        );
      } else {
        await createSubjectGroup(payload);

        showToast(
          "Subject group created successfully"
        );
      }

      resetForm();

      await fetchGroups();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };


  // =========================================================
  // DELETE
  // =========================================================

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteSubjectGroup(
        deleteTarget._id
      );

      showToast(
        "Subject group deleted successfully"
      );

      if (editingId === deleteTarget._id) {
        resetForm();
      }

      setDeleteTarget(null);

      await fetchGroups();
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
          "Unable to delete subject group. Please try again.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };


  // =========================================================
  // TABLE COLUMNS
  // =========================================================

  const columns = [
    {
      field: "academicYear",
      headerName: "Year",

      render: (row) =>
        row.academicYear?.name || "—",
    },

    {
      field: "groupName",
      headerName: "Group Name",
    },

    {
      field: "class",
      headerName: "Class",

      render: (row) =>
        row.class?.className ? (
          <span
            className="
              badge
              rounded-pill
              bg-secondary-subtle
              text-secondary-emphasis
              border
              border-secondary-subtle
              fw-normal
            "
            style={{
              fontSize: "0.75rem",
            }}
          >
            {row.class.className}
          </span>
        ) : (
          "—"
        ),
    },

    {
      field: "sections",
      headerName: "Sections",

      render: (row) => (
        <PillList
          items={
            row.sections?.map(
              (section) =>
                section.sectionName
            ) || []
          }
          variant="primary"
        />
      ),
    },

    {
      field: "subjects",
      headerName: "Subjects",

      render: (row) => (
        <PillList
          items={
            row.subjects?.map(
              (subject) =>
                subject.subjectName
            ) || []
          }
          variant="primary"
        />
      ),
    },

    {
      field: "description",
      headerName: "Description",

      muted: true,

      render: (row) =>
        row.description || "—",
    },

    {
      field: "active",
      headerName: "Status",

      render: (row) => (
        <StatusChip
          active={row.active}
        />
      ),
    },
  ];


  // =========================================================
  // UI
  // =========================================================

  return (
    <MainLayout>
      <div className="container-fluid">

        {/* ================================================= */}
        {/* PAGE HEADER */}
        {/* ================================================= */}

        <div
          className="
            d-flex
            flex-wrap
            justify-content-between
            align-items-center
            gap-2
            mb-4
          "
        >
          <div>
            <h5 className="fw-bold mb-1">
              Subject Groups
            </h5>

            <p className="text-muted small mb-0">
              Assign subjects to classes and sections
            </p>
          </div>
        </div>


        <div className="row g-4">

          {/* ================================================= */}
          {/* FORM */}
          {/* ================================================= */}

          <div className="col-12 col-xl-4">

            <div className="card shadow-sm rounded-3">

              <div className="card-body">

                <div
                  className="
                    d-flex
                    justify-content-between
                    align-items-center
                    mb-3
                  "
                >
                  <h6 className="fw-bold mb-0">
                    {editingId
                      ? "Edit Subject Group"
                      : "Add Subject Group"}
                  </h6>

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      <CloseIcon fontSize="small" />
                    </button>
                  )}
                </div>


                <form onSubmit={handleSubmit}>

                  {/* ========================================= */}
                  {/* ACADEMIC YEAR */}
                  {/* ========================================= */}

                  <div className="mb-3">
                    <AcademicYearBadge />
                  </div>


                  {/* ========================================= */}
                  {/* GROUP NAME */}
                  {/* ========================================= */}

                  <div className="mb-3">

                    <label className="form-label">
                      Group Name{" "}
                      <span className="text-danger">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      className={`form-control ${
                        formErrors.groupName
                          ? "is-invalid"
                          : ""
                      }`}
                      value={form.groupName}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          groupName:
                            event.target.value,
                        }));

                        setFormErrors((prev) => ({
                          ...prev,
                          groupName: "",
                        }));
                      }}
                      placeholder="e.g. Science Group"
                      disabled={submitting}
                    />

                    {formErrors.groupName && (
                      <div className="invalid-feedback">
                        {formErrors.groupName}
                      </div>
                    )}

                  </div>


                  {/* ========================================= */}
                  {/* CLASS */}
                  {/* ========================================= */}

                  <div className="mb-3">

                    <label className="form-label">
                      Class{" "}
                      <span className="text-danger">
                        *
                      </span>
                    </label>

                    <select
                      className={`form-select ${
                        formErrors.class
                          ? "is-invalid"
                          : ""
                      }`}
                      value={form.class}
                      onChange={(event) =>
                        handleClassChange(
                          event.target.value
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

                    {formErrors.class && (
                      <div className="invalid-feedback">
                        {formErrors.class}
                      </div>
                    )}

                  </div>


                  {/* ========================================= */}
                  {/* SECTIONS */}
                  {/* ========================================= */}

                  <div className="mb-4">

                    <div
                      className="
                        d-flex
                        justify-content-between
                        align-items-center
                        mb-2
                      "
                    >

                      <label className="form-label mb-0">
                        Sections{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </label>

                      {availableSections.length >
                        0 && (
                        <div className="d-flex gap-2">

                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            onClick={
                              selectAllSections
                            }
                            disabled={
                              submitting
                            }
                          >
                            Select All
                          </button>

                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-muted"
                            onClick={
                              clearAllSections
                            }
                            disabled={
                              submitting
                            }
                          >
                            Clear
                          </button>

                        </div>
                      )}

                    </div>


                    {!form.class ? (

                      <div className="border rounded-3 p-3">
                        <div className="text-muted small">
                          Select a class first
                        </div>
                      </div>

                    ) : availableSections.length ===
                      0 ? (

                      <div className="border rounded-3 p-3">
                        <div className="text-muted small">
                          This class has no
                          sections assigned.
                        </div>
                      </div>

                    ) : (

                      <div className="border rounded-3 p-2">

                        <div className="row g-2">

                          {availableSections.map(
                            (section) => {

                              const checked =
                                form.sections.includes(
                                  section._id
                                );

                              return (
                                <div
                                  key={section._id}
                                  className="col-6"
                                >

                                  <label
                                    className={`
                                      d-flex
                                      align-items-center
                                      gap-2
                                      p-2
                                      rounded-2
                                      border
                                      ${
                                        checked
                                          ? "border-primary bg-primary-subtle"
                                          : "border-light-subtle"
                                      }
                                    `}
                                    style={{
                                      cursor:
                                        submitting
                                          ? "default"
                                          : "pointer",
                                    }}
                                  >

                                    <input
                                      type="checkbox"
                                      className="form-check-input m-0"
                                      checked={
                                        checked
                                      }
                                      disabled={
                                        submitting
                                      }
                                      onChange={() =>
                                        toggleSection(
                                          section._id
                                        )
                                      }
                                    />

                                    <span className="small">
                                      {
                                        section.sectionName
                                      }
                                    </span>

                                  </label>

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>

                    )}

                    {formErrors.sections && (
                      <div className="text-danger small mt-1">
                        {formErrors.sections}
                      </div>
                    )}

                  </div>


                  {/* ========================================= */}
                  {/* SUBJECTS */}
                  {/* ========================================= */}

                  <div className="mb-4">

                    <div
                      className="
                        d-flex
                        justify-content-between
                        align-items-center
                        mb-2
                      "
                    >

                      <label className="form-label mb-0">
                        Subjects{" "}
                        <span className="text-danger">
                          *
                        </span>
                      </label>

                      {allSubjects.length > 0 && (
                        <div className="d-flex gap-2">

                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            onClick={
                              selectAllSubjects
                            }
                            disabled={
                              submitting
                            }
                          >
                            Select All
                          </button>

                          <button
                            type="button"
                            className="
                              btn
                              btn-link
                              btn-sm
                              p-0
                              text-muted
                            "
                            onClick={
                              clearAllSubjects
                            }
                            disabled={
                              submitting
                            }
                          >
                            Clear
                          </button>

                        </div>
                      )}

                    </div>


                    {loadingOptions ? (

                      <div className="border rounded-3 p-3">
                        <div className="text-muted small">
                          Loading subjects...
                        </div>
                      </div>

                    ) : allSubjects.length === 0 ? (

                      <div className="border rounded-3 p-3">

                        <div className="text-muted small mb-2">
                          No subjects found.
                        </div>

                        <div className="small">
                          Create subjects first in
                          Subject Master.
                        </div>

                      </div>

                    ) : (

                      <div className="border rounded-3 p-2">

                        <div
                          className="
                            row
                            g-2
                            subject-selection-list
                          "
                          style={{
                            maxHeight: "280px",
                            overflowY: "auto",
                          }}
                        >

                          {allSubjects.map(
                            (subject) => {

                              const checked =
                                form.subjects.includes(
                                  subject._id
                                );

                              return (
                                <div
                                  key={subject._id}
                                  className="
                                    col-12
                                    col-sm-6
                                  "
                                >

                                  <label
                                    className={`
                                      d-flex
                                      align-items-center
                                      gap-2
                                      p-2
                                      rounded-2
                                      border
                                      ${
                                        checked
                                          ? "border-primary bg-primary-subtle"
                                          : "border-light-subtle"
                                      }
                                    `}
                                    style={{
                                      cursor:
                                        submitting
                                          ? "default"
                                          : "pointer",

                                      transition:
                                        "all 0.15s ease",
                                    }}
                                  >

                                    <input
                                      type="checkbox"
                                      className="form-check-input m-0"
                                      checked={
                                        checked
                                      }
                                      disabled={
                                        submitting
                                      }
                                      onChange={() =>
                                        toggleSubject(
                                          subject._id
                                        )
                                      }
                                    />

                                    <div className="flex-grow-1">

                                      <div className="small fw-medium">
                                        {
                                          subject.subjectName
                                        }
                                      </div>

                                      {subject.code && (
                                        <div className="text-muted small">
                                          {
                                            subject.code
                                          }
                                        </div>
                                      )}

                                    </div>

                                  </label>

                                </div>
                              );
                            }
                          )}

                        </div>

                        {/* SELECTED COUNT */}

                        <div
                          className="
                            border-top
                            mt-2
                            pt-2
                            px-1
                          "
                        >

                          <small className="text-muted">

                            <strong>
                              {form.subjects.length}
                            </strong>{" "}

                            subject
                            {form.subjects.length !==
                            1
                              ? "s"
                              : ""}{" "}
                            selected

                          </small>

                        </div>

                      </div>

                    )}

                    {formErrors.subjects && (
                      <div className="text-danger small mt-1">
                        {formErrors.subjects}
                      </div>
                    )}

                  </div>


                  {/* ========================================= */}
                  {/* DESCRIPTION */}
                  {/* ========================================= */}

                  <div className="mb-3">

                    <label className="form-label">
                      Description
                    </label>

                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.description}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          description:
                            event.target.value,
                        }))
                      }
                      placeholder="Optional description"
                      disabled={submitting}
                    />

                  </div>


                  {/* ========================================= */}
                  {/* ACTIVE */}
                  {/* ========================================= */}

                  <div className="form-check form-switch mb-4">

                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="subjectGroupActiveSwitch"
                      checked={form.active}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          active:
                            event.target.checked,
                        }))
                      }
                      disabled={submitting}
                    />

                    <label
                      className="form-check-label"
                      htmlFor="subjectGroupActiveSwitch"
                    >
                      {form.active
                        ? "Active"
                        : "Inactive"}
                    </label>

                  </div>


                  {/* ========================================= */}
                  {/* BUTTONS */}
                  {/* ========================================= */}

                  <div className="d-flex gap-2">

                    <button
                      type="submit"
                      className="btn btn-primary flex-grow-1"
                      disabled={submitting}
                    >

                      {submitting ? (
                        <>
                          <span
                            className="
                              spinner-border
                              spinner-border-sm
                              me-2
                            "
                          />

                          Saving...
                        </>
                      ) : editingId ? (
                        "Update Subject Group"
                      ) : (
                        "Save Subject Group"
                      )}

                    </button>


                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={resetForm}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    )}

                  </div>

                </form>

              </div>
            </div>
          </div>


          {/* ================================================= */}
          {/* LIST */}
          {/* ================================================= */}

          <div className="col-12 col-xl-8">

            <div className="card shadow-sm rounded-3">

              <div className="card-body">

                <div
                  className="
                    d-flex
                    flex-wrap
                    justify-content-between
                    align-items-center
                    gap-2
                    mb-3
                  "
                >

                  <div>
                    <h6 className="fw-bold mb-1">
                      Subject Group List
                    </h6>

                    <small className="text-muted">
                      {filteredGroups.length} group
                      {filteredGroups.length !==
                      1
                        ? "s"
                        : ""}
                    </small>
                  </div>


                  <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search groups..."
                  />

                </div>


                {error && (
                  <div className="alert alert-danger py-2">
                    {error}
                  </div>
                )}


                <ResponsiveDataList
                  columns={columns}
                  rows={filteredGroups}
                  loading={loading}
                  minWidth={900}
                  emptyMessage="No subject groups found. Use the form to create one."
                  renderActions={(row) => (
                    <RowActions
                      onEdit={() =>
                        handleEditClick(row)
                      }
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
      </div>


      {/* ================================================= */}
      {/* DELETE CONFIRM */}
      {/* ================================================= */}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subject Group"
        message={`Are you sure you want to delete "${deleteTarget?.groupName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() =>
          setDeleteTarget(null)
        }
        loading={deleting}
      />

    </MainLayout>
  );
}