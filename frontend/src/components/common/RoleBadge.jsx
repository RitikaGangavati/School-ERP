const ROLE_COLORS = {
  "Super Admin": "danger",
  Admin: "primary",
  Teacher: "success",
  Student: "info",
  Parent: "secondary",
  Accountant: "warning",
  Librarian: "dark",
  Receptionist: "purple",
};

export default function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || "secondary";

  return (
    <span className={`badge bg-${color} bg-opacity-75 px-2 py-1`} style={{ fontWeight: 500 }}>
      {role}
    </span>
  );
}