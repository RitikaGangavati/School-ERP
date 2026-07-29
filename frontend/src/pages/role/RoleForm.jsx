import { useEffect, useState } from "react";
import { Modal, Button, Spinner, Form } from "react-bootstrap";

export default function RoleForm({ open, onClose, onSubmit, initialData }) {
  const isEdit = Boolean(initialData);

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRoleName(initialData?.roleName || "");
      setDescription(initialData?.description || "");
      setActive(initialData?.active ?? true);
      setNameError("");
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      setNameError("Role name is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        roleName: roleName.trim(),
        description: description.trim(),
        active,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={open} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{isEdit ? "Edit Role" : "Add Role"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Role Name</Form.Label>
          <Form.Control
            value={roleName}
            onChange={(e) => {
              setRoleName(e.target.value);
              if (nameError) setNameError("");
            }}
            isInvalid={!!nameError}
            disabled={submitting}
            autoFocus
          />
          <Form.Control.Feedback type="invalid">{nameError}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </Form.Group>

        <Form.Check
          type="switch"
          label={active ? "Active" : "Inactive"}
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          disabled={submitting}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="light" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Spinner size="sm" animation="border" /> : isEdit ? "Update" : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}