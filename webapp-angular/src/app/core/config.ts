import { environment } from '../../environments/environment';

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export const config = {
  apiUrl: stripTrailingSlash(environment.apiUrl),
  socketUrl: stripTrailingSlash(environment.socketUrl),
  pageSize: environment.pageSize,
  apiTimeout: environment.apiTimeout,
  isProduction: environment.production,
};

export default config;
