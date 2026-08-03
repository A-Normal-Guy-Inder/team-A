// Which journey sent the user to /verify. The OTP screen is shared by three entry
// points that need different destinations once the code checks out, so each caller
// names its own flow rather than leaving VerifyEmail to infer it from a boolean.
export const OTP_FLOW = {
  SIGNUP: 'signup',
  LOGIN_UNVERIFIED: 'login_unverified',
  PASSWORD_RESET: 'password_reset',
  TWO_FACTOR: 'two_factor',
} as const;

export type OtpFlow = (typeof OTP_FLOW)[keyof typeof OTP_FLOW];

/** What Login / Signup / ForgotPassword hand to /verify through router state. */
export interface OtpNavigationState {
  email?: string;
  flow?: OtpFlow;
  /*
   * Only the two-factor flow carries this: the session length was chosen on the
   * login form, but the cookie is not minted until the code is redeemed a
   * screen later, so the choice has to travel with the user.
   */
  rememberMe?: boolean;
}
