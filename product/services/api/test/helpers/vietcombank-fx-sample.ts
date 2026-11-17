/**
 * FB-INV-011: the public Vietcombank exchange-rate XML as served on 17/11/2026 12:05 VN
 * (GET https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10 – HTTP 200, text/xml, 2.565 bytes).
 * Public market data, no personal data. Kept byte-for-byte (padding in CurrencyName included) so the parser is tested
 * against the real shape.
 */
export const VCB_SAMPLE_XML = `<!--For reference only. Only one request every 5 minutes!-->
<ExrateList>
  <DateTime>11/17/2026 12:05:08 PM</DateTime>
  <Exrate CurrencyCode="AUD" CurrencyName="AUSTRALIAN DOLLAR   " Buy="16,917.04" Transfer="17,087.92" Sell="17,635.75" />
  <Exrate CurrencyCode="CAD" CurrencyName="CANADIAN DOLLAR     " Buy="17,539.33" Transfer="17,716.49" Sell="18,284.47" />
  <Exrate CurrencyCode="CHF" CurrencyName="SWISS FRANC         " Buy="29,882.67" Transfer="30,184.52" Sell="31,152.21" />
  <Exrate CurrencyCode="CNY" CurrencyName="YUAN RENMINBI       " Buy="3,763.92" Transfer="3,801.94" Sell="3,923.82" />
  <Exrate CurrencyCode="DKK" CurrencyName="DANISH KRONE        " Buy="-" Transfer="3,719.96" Sell="3,862.33" />
  <Exrate CurrencyCode="EUR" CurrencyName="EURO                " Buy="27,601.48" Transfer="27,880.29" Sell="29,057.60" />
  <Exrate CurrencyCode="GBP" CurrencyName="POUND STERLING      " Buy="33,084.16" Transfer="33,418.34" Sell="34,489.72" />
  <Exrate CurrencyCode="HKD" CurrencyName="HONGKONG DOLLAR     " Buy="3,188.02" Transfer="3,220.22" Sell="3,343.47" />
  <Exrate CurrencyCode="INR" CurrencyName="INDIAN RUPEE        " Buy="-" Transfer="272.49" Sell="284.22" />
  <Exrate CurrencyCode="JPY" CurrencyName="YEN                 " Buy="155.51" Transfer="157.08" Sell="166.22" />
  <Exrate CurrencyCode="KRW" CurrencyName="KOREAN WON          " Buy="16.63" Transfer="18.47" Sell="20.04" />
  <Exrate CurrencyCode="KWD" CurrencyName="KUWAITI DINAR       " Buy="-" Transfer="82,875.78" Sell="86,895.51" />
  <Exrate CurrencyCode="MYR" CurrencyName="MALAYSIAN RINGGIT   " Buy="-" Transfer="6,230.82" Sell="6,366.58" />
  <Exrate CurrencyCode="NOK" CurrencyName="NORWEGIAN KRONER    " Buy="-" Transfer="2,613.62" Sell="2,724.53" />
  <Exrate CurrencyCode="RUB" CurrencyName="RUSSIAN RUBLE       " Buy="-" Transfer="296.68" Sell="328.41" />
  <Exrate CurrencyCode="SAR" CurrencyName="SAUDI RIAL          " Buy="-" Transfer="6,820.72" Sell="7,114.50" />
  <Exrate CurrencyCode="SEK" CurrencyName="SWEDISH KRONA       " Buy="-" Transfer="2,499.52" Sell="2,605.59" />
  <Exrate CurrencyCode="SGD" CurrencyName="SINGAPORE DOLLAR    " Buy="19,448.87" Transfer="19,645.32" Sell="20,315.74" />
  <Exrate CurrencyCode="THB" CurrencyName="THAILAND BAHT       " Buy="671.03" Transfer="745.59" Sell="777.22" />
  <Exrate CurrencyCode="USD" CurrencyName="US DOLLAR           " Buy="25,520.00" Transfer="25,550.00" Sell="25,930.00" />
  <Source>Joint Stock Commercial Bank for Foreign Trade of Vietnam - Vietcombank</Source>
</ExrateList>`;

/** The 4 SELL rates of the sample (what the parser must return). */
export const VCB_SAMPLE_RATES = { USD: 25_930, KRW: 20.04, CNY: 3_923.82, RUB: 328.41 } as const;

/** A board of `date` (M/D/YYYY) with the given SELL rates – same shape as the real file. */
export function vcbBoard(
  mdy: string,
  time: string,
  sells: Record<string, string>,
  extra = '',
): string {
  const lines = Object.entries(sells).map(
    ([c, s]) =>
      `  <Exrate CurrencyCode="${c}" CurrencyName="X" Buy="-" Transfer="1.00" Sell="${s}" />`,
  );
  return `<ExrateList>\n  <DateTime>${mdy} ${time}</DateTime>\n${lines.join('\n')}\n${extra}</ExrateList>`;
}
