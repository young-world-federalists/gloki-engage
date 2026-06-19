import { EmptyState, Button } from 'gloki-ds';
import { Inbox, Users } from 'lucide-react';

export const Basic = () => (
  <EmptyState
    icon={<Inbox size={48} />}
    title="No proposals yet"
    message="Be the first to propose a solution to this problem."
    action={<Button>Add a proposal</Button>}
  />
);

export const Compact = () => (
  <div style={{ maxWidth: 360 }}>
    <EmptyState compact icon={<Users size={40} />} title="No members yet" message="Invite people to get started." />
  </div>
);
