import { connectionStatus } from './lib/ha/connection';
import { setupRequested } from './lib/config';
import { SetupScreen } from './components/SetupScreen';
import { Shell } from './components/Shell';

export function App() {
  const status = connectionStatus.value;
  if (status === 'unconfigured' || status === 'auth-failed' || setupRequested.value) {
    return (
      <SetupScreen
        authFailed={status === 'auth-failed'}
        onCancel={setupRequested.value ? () => (setupRequested.value = false) : undefined}
      />
    );
  }
  return <Shell />;
}
