import { render } from 'preact';
import { App } from './app';
import { loadConfig } from './lib/config';
import { getConnection } from './lib/ha/connection';
import './styles/theme.css';
import './styles/base.css';

if (loadConfig()) {
  getConnection().catch(() => {
    /* auth-failed is reflected in connectionStatus; App routes to setup */
  });
}

render(<App />, document.getElementById('app')!);
