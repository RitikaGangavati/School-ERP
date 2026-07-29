import { Badge } from "react-bootstrap";

export default function StatusChip({ active }) {
  return (
    <Badge bg={active ? "success" : "secondary"} pill>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}