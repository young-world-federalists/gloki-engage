import { Modal, Button } from 'gloki-ds';

export const Confirm = () => (
  <Modal
    isOpen
    onClose={() => {}}
    title="Delete this proposal?"
    closeLabel="Close"
    footer={<><Button variant="ghost">Cancel</Button><Button variant="destructive">Delete</Button></>}
  >
    <p style={{ margin: 0 }}>This permanently removes the proposal and its votes. This can’t be undone.</p>
  </Modal>
);
