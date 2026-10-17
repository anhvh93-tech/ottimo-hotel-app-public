/** Guest-session cookie name (SR-GST-02) – shared by the guest resolver and the upload session check. */
export function guestCookieName(securePrefix: boolean): string {
  return `${securePrefix ? '__Host-' : ''}ottimo_gsid`;
}
