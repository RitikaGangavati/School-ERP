import { Modal, Button, Spinner } from "react-bootstrap";

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel = "Delete",
  confirmVariant = "danger",
}) {
  return (
    <Modal show={open} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title as="h6">{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>{message}</Modal.Body>

      <Modal.Footer>
        <Button variant="light" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}