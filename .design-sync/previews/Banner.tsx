import { Banner, Button } from 'gloki-ds';

export const Tones = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
    <Banner tone="info" title="Heads up">Voting opens tomorrow at 09:00 UTC.</Banner>
    <Banner tone="success" title="Saved">Your changes were saved.</Banner>
    <Banner tone="warning" title="Almost there">Add a country to finish your profile.</Banner>
    <Banner tone="error" title="Something went wrong">We couldn’t reach the server.</Banner>
  </div>
);

export const WithAction = () => (
  <div style={{ maxWidth: 480 }}>
    <Banner tone="info" title="Finish setting up" action={<Button size="sm" variant="secondary">Continue</Button>}>
      Your profile is almost ready.
    </Banner>
  </div>
);

export const Dismissible = () => (
  <div style={{ maxWidth: 480 }}>
    <Banner tone="success" onDismiss={() => {}} dismissLabel="Dismiss">Mandate published to the community.</Banner>
  </div>
);
