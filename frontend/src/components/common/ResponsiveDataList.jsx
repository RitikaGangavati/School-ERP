import { useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Typography,
  CircularProgress,
} from "@mui/material";

export default function ResponsiveDataList({
  columns,
  rows,
  getRowId = (row) => row._id,
  loading,
  emptyMessage = "No records found.",
  renderActions,
  minWidth = 600,
  paginated = true,
  rowsPerPageOptions = [5, 10, 25],
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1] || 10);
  
  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // reset to first page when page size changes
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={5}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Box py={5} textAlign="center">
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const displayedRows = paginated
    ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : rows;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <TableContainer sx={{ maxWidth: "100%" }}>
        <Table sx={{ minWidth }}>
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {col.headerName}
                </TableCell>
              ))}
              {renderActions && (
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }} align="right">
                  Action
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {displayedRows.map((row) => (
              <TableRow key={getRowId(row)} hover>
                {columns.map((col) => (
                  <TableCell
                    key={col.field}
                    sx={{ color: col.muted ? "text.secondary" : "inherit", whiteSpace: "nowrap" }}
                  >
                    {col.render ? col.render(row) : row[col.field] || "—"}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {renderActions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {paginated && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </Paper>
  );
}