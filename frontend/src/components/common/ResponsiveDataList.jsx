import { useState } from "react";
import { Table, Spinner, Pagination } from "react-bootstrap";

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

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <div className="text-center text-muted py-5">{emptyMessage}</div>;
  }

  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const displayedRows = paginated
    ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : rows;

  return (
    <div className="border rounded-3 bg-white overflow-hidden">
      <div style={{ overflowX: "auto" }}>
        <Table
          hover
          responsive
          className="mb-0 align-middle"
          style={{ minWidth }}
        >
          <colgroup>
            {columns.map((col) => (
              <col key={col.field} style={{ width: col.width || "auto" }} />
            ))}
            {renderActions && <col style={{ width: "110px" }} />}
          </colgroup>

          <thead className="table-light">
            <tr>
              {columns.map((col) => (
                <th key={col.field} className="text-nowrap align-middle">
                  {col.headerName}
                </th>
              ))}
              {renderActions && (
                <th className="text-nowrap text-end align-middle">Action</th>
              )}
            </tr>
          </thead>

          <tbody>
            {displayedRows.map((row) => (
              <tr key={getRowId(row)}>
                {columns.map((col) => (
                  <td
                    key={col.field}
                    className={`text-nowrap ${col.muted ? "text-muted" : ""}`}
                    style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {col.render ? col.render(row) : row[col.field] || "—"}
                  </td>
                ))}
                {renderActions && (
                  <td className="text-nowrap text-end">{renderActions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {paginated && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center p-2 border-top flex-wrap gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
          >
            {rowsPerPageOptions.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          <Pagination className="mb-0">
            <Pagination.Prev
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            />
            <Pagination.Item
              disabled
            >{`${page + 1} / ${totalPages}`}</Pagination.Item>
            <Pagination.Next
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
}
