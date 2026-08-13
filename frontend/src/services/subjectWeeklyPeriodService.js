import api from "../utils/axios";

const BASE_URL = "/api/subject-weekly-periods";

export const createSubjectWeeklyPeriod = (data) => api.post(`${BASE_URL}/create`, data);

export const getSubjectWeeklyPeriods = () => api.get(`${BASE_URL}/list`);

export const getSubjectWeeklyPeriodById = (id) => api.get(`${BASE_URL}/details/${id}`);

export const getSubjectWeeklyPeriodsBySection = (
  academicYear,
  classId,
  sectionId
) =>
  api.get(`${BASE_URL}/by-section`, {
    params: {
      academicYear,
      class: classId,
      section: sectionId,
    },
  });

export const updateSubjectWeeklyPeriod = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);

export const deleteSubjectWeeklyPeriod = (id) => api.delete(`${BASE_URL}/delete/${id}`);