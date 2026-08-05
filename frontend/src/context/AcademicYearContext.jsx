import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentAcademicYear } from "../services/academicYearService";

const AcademicYearContext = createContext(null);

export function AcademicYearProvider({ children }) {
  const [currentYear, setCurrentYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCurrentAcademicYear();
      setCurrentYear(res.data.academicYear);
    } catch (err) {
      setCurrentYear(null);
      setError(err.response?.data?.message || "No current academic year set");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  return (
    <AcademicYearContext.Provider value={{ currentYear, loading, error, refetch: fetchCurrent }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export const useAcademicYear = () => useContext(AcademicYearContext);