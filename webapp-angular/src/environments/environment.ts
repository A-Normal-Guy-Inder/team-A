/*
 * Build-time overrides. These are the Angular equivalent of the webapp's
 * REACT_APP_* variables — the difference is that CRA read them from the shell at
 * build time, while Angular swaps this whole file per configuration (see
 * `fileReplacements` in angular.json).
 *
 * Leave a field empty to fall back to the runtime default derived from
 * window.location — see core/config.ts.
 */
export const environment = {
  production: false,
  apiUrl: '',
  socketUrl: '',
  apiPort: '5000',
  pageSize: 12,
  apiTimeout: 90000,
};
