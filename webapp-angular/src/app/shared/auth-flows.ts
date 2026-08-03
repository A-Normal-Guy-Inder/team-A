// Which journey reached /verify
export const OTP_FLOW = {
  SIGNUP: 'signup',
  LOGIN_UNVERIFIED: 'login_unverified',
  PASSWORD_RESET: 'password_reset',
  TWO_FACTOR: 'two_factor',
} as const;

export type OtpFlow = (typeof OTP_FLOW)[keyof typeof OTP_FLOW];

/** Router state for /verify */
export interface OtpNavigationState {
  email?: string;
  flow?: OtpFlow;
  /* Two-factor flow only */
  rememberMe?: boolean;
}
