import { connectionStatus } from './lib/ha/connection';
import { SetupScreen } from './components/SetupScreen';
import { Shell } from './components/Shell';

export function App() {
  const status = connectionStatus.value;
  if (status === 'unconfigured' || status === 'auth-failed') {
    return <SetupScreen authFailed={status === 'auth-failed'} />;
  }
  return <Shell />;
}
