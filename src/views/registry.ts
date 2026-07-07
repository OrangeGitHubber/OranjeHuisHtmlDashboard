/**
 * Built-in view loaders. Pages themselves live in settings (settings.pages)
 * and are all grid pages; the settings view is always routable at #/settings.
 *
 * Loaders are module-level constants — AsyncView caches on their identity.
 */

export const settingsLoader = () => import('./settings/SettingsView');
