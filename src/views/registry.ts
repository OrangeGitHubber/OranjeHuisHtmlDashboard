/**
 * Built-in (non-grid) view loaders. Pages themselves live in settings
 * (settings.pages); a page with kind 'cameras' renders the cameras view,
 * and the settings view is always routable at #/settings.
 *
 * Loaders are module-level constants — AsyncView caches on their identity.
 */

export const camerasLoader = () => import('./cameras/CamerasView');
export const settingsLoader = () => import('./settings/SettingsView');
