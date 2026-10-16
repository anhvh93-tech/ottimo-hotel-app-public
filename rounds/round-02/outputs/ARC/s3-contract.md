# ARC – Round 2, Sprint 3 khởi động: OpenAPI 0.3.6 + chia vùng code 3 BE

- Vai: ARC | Ngày: 16/10/2026 | Bước: Sản xuất (phần hợp đồng – bước chặn dev) | **Không commit**, không sửa mã viết tay
- Đầu vào: plan.md mục 4 (Sprint 3) · `outputs/ARC/s2-contract.md` nhóm B · specs `EP03-05-stay.md`, `EP06-registration.md`, `EP02` mục 8 · hi-fi H13–H18 · SEC `outputs/SEC/s3-checklist.md` + decision-log 16/10 · DOM `reviews/s2-DOM.md` mục G + `outputs/DOM/s3-report.md` (BE-11, BE-12) · UXD `outputs/UXD/s3-report.md` mục 5 · BE-A `outputs/BE/s3-dk2.md` mục 6 · mã `services/api` (chỉ đọc)
- Sản phẩm: `product/docs/api/openapi.yaml` **0.3.6-draft** (đã áp thẳng); `product/docs/erd.md` (dòng 0.3.6); file sinh: `services/api/src/generated/openapi-meta.ts`, `openapi-schemas.ts`, `packages/api-client/src/generated/openapi.ts`, `tests/fixtures/rbac-cases.{json,csv}`, `docs/qa/traceability.md`; 12 dòng decision-log

## 1. Kiểm tra đã chạy (trên file thật)
| Lệnh | Kết quả |
|---|---|
| `openapi-spec-validator` | OK |
| `redocly lint` | Hợp lệ, 4 cảnh báo cũ (không mới) |
| `node scripts/gen-openapi-meta.mjs` rồi `--check` | Đã sinh lại; up to date |
| `packages/api-client` `node scripts/gen.mjs --check` | up to date; `tsc --noEmit` services/api, admin-web: 0 lỗi |
| `gen_rbac_cases.py` (+ `--check`) | 189 operation (+8 so với 0.3.5), 2079 ca, rbac mismatch [] |
| `gen_traceability.py --strict` | exit 0; ops/fields mismatched 0; `x-rbac-field` 144, unknown []; A46a/A47a (BA rbac 0.2.3) khớp vai |
| `vitest` contract/serializer/http | 21/21 xanh |

Lưu ý BE-B: khóa `payment_receiving_account` đặt ở **`setParameter.x-reauth-parameters`** (không ở `x-security-parameters`) vì `SecurityParameterBounds` (mã viết tay) chỉ nhận integer/array/object số – đưa vào đó làm `tsc` đỏ.

## 2. Quyết định 0.3.6 (đã áp)
### 2.1 Nhóm B cũ đến hạn
| ID | Nội dung đã áp | Nguồn |
|---|---|---|
| B-01 | `getAttachment` (mới) + `uploadAttachment` viết lại: C2, DEK riêng mỗi tệp, `purpose` enum đóng, phạm vi theo `purpose` (ngoài phạm vi/đã xóa → 404), header `inline; filename="attachment"`, `nosniff`, CSP sandbox, `private, no-store`, CORP same-origin; `reservationId` bắt buộc với `deposit_receipt`/`penalty_evidence`; 413/429; thời hạn lưu E07-12 (a) theo SEC I5. `PaymentCreate.attachmentId` bỏ chặn A-17 | SEC I1–I7 |
| B-13 | `cancelReservation`, `markNoShow`, `resolveOverbookingExternal`: thu hồi mọi link/phiên khách cùng giao dịch; `restoreNoShow` không mở lại | SEC G4 |
| B-14/15/16 | `listGuestRequestOptions` (mới, mức 1); `createGuestRequest.feeAccepted` (`FEE_NOT_ACCEPTED`, `REQUEST_TYPE_NOT_AVAILABLE`); `transitionGuestRequest.declinedReasonCode` + `replyNote` (≤ 300, Luhn, `SENSITIVE_DATA_DETECTED` ≥ 6 chữ số); `x-sec-review: approved-DK2 (SEC 16/10/2026)` kèm đủ điều kiện SEC J. **Cài ở Sprint 4** | SEC J |
| B-21 | `AttentionItem.refCode`, `params` (danh sách khóa cho phép theo `kind` trong code, khóa lạ → lỗi) + 6 `kind` (gồm `reconcile_overdue` cần cho Sprint 3) | SEC J |
| B-28 | `ReservationPatch.doorAccessHandedOver` (chỉ `true`, FD+, `in_house`, một lần → 409) | BA E03-06, UXD #3 |
| B-29 = DOM BE-11 | `confirmDeposit.acceptShortfallReason` (MGR+, audit `deposit.shortfall_accepted` + `shortfallVnd`, push OWN) | DOM D-9, UXD #3 |

### 2.2 Mục mới (A-29…A-40)
| ID | Hợp đồng | Nguồn |
|---|---|---|
| A-29 | Tài khoản nhận VietQR `payment_receiving_account` (`setParameter.x-reauth-parameters`): chỉ OWN, `reauth` mật khẩu trong request (401 `REAUTH_FAILED`), audit `money` số che, push + `receiving_account_changed` tới mọi OWN/MGR; API không bao giờ trả số đầy đủ. `createVietQr` thêm `receivingAccountMasked`, `receivingAccountChangedAt`, `receivingAccountRecentlyChanged` (24 giờ); ảnh QR **vẽ tại chỗ** từ `qrPayload` | SEC F1–F3 |
| A-30 | `setLateCheckout` `dryRun` chạy giao dịch `readOnly`, không `uow.run` | SEC A3 [CHẶN] |
| A-31 | `GuestStay.property.mapUrl`: https + 5 host chính xác | SEC E14-08 |
| A-32 | `checkOut`: phụ thu trả muộn tính theo **giờ trả thực tế**, lệch bậc (kể cả thấp hơn) → đảo dòng cũ + ghi dòng mới (G-10). `getBill`: không in cặp dòng gốc/đảo (G-12); `Bill.paymentModel` + `otaPrepaidNote` (`ota_prepaid` ẩn tiền phòng; `ota_pay_at_property` in giá OTA, thu tại quầy) (G-13) | DOM G-10/12/13 |
| A-33 | **Chi hoàn** (G-14, SEC F8): `setRefundDestination` (PUT, FD+ A43, C3 `refund_account`, thiết bị được cấp, Luhn chặn số thẻ, đổi sau duyệt → về `pending`), `getRefundDestination` (OWN/MGR A47, step-up, log `view`), `executeRefund` (OWN/MGR A47: yêu cầu `approved`, ≤ số duyệt còn lại và ≤ đã thu − đã hoàn, `409 REFUND_DESTINATION_REQUIRED`, `422 REFUND_EXCEEDS_APPROVED`, hủy DEK khi hoàn đủ; `bank_transfer` → `reconciliation=pending`, `cash` → vào ca). `recordPayment type=refund` → 422. `Payment.approvalRequestId`, `ApprovalRequest.refundDestination` (che), `refundedVnd` | DOM G-14, SEC F8, rbac A43/A47 |
| A-34 | Trả thừa khi trả phòng: `Folio.totals.creditVnd`, `CheckoutSummary.creditVnd`, blocker `credit_balance`; `checkOut.overpaymentHandling {mode: refund_request \| retain_with_guest_consent (MGR+), reason}` – thiếu → `OVERPAYMENT_HANDLING_REQUIRED`; yêu cầu `refund` **không** tính vào `pending_approvals` | DOM G-15 |
| A-35 | SSE `registration.changed` (FD+), `payment.changed` (MGR+ và người ghi); folio đổi → `reservation.changed` | H14 `streamEvents {type: registration}` |
| A-36 | `StaffNotification.kind` + `online_checkin_completed`, `payment_disputed`, `deposit_shortfall_accepted`, `receiving_account_changed`, `refund_ready`; `refType` + `payment`, `property` | EP06 8.3, SEC F3/F5 |
| A-37 | `changeRoom`: số khách > `maxOccupancy` căn mới → **chặn cứng** `CAPACITY_EXCEEDED` mọi kênh (không có ô lý do – trả lời UXD #5, giả định 3 đúng); 422 khai báo; `effectiveDate`/`cause` mô tả rõ | UXD #5 |
| A-38 | `removePartyMember`: người đứng tên → 409; giấy tờ người bị bỏ → xóa C3 cùng giao dịch (port registration); `confirmed` → `needs_update`; thêm `Idempotency-Key`, 404/409 | EP02 mục 8 |
| A-39 | `updateRoom` 200 = `Room` + `warnings[{code: FUTURE_RESERVATIONS_KEEP_ROOM, count}]` (không chặn, mảng rỗng khi không có). Chọn `warnings[]` thay `Room.futureReservationCount` vì dùng lại được cho cảnh báo sau, không thêm cột "ảo" vào `Room` ở mọi GET | BE-A s3-dk2 mục 6 (ĐK-S2-2) |
| A-41 | Theo BA specs v0.2 (`outputs/BA/s3-report.md`): **E15-01** `createRefundRequest` (FD+ A43, ≤ `creditVnd` còn chưa yêu cầu); **E15-02** `purpose=refund_proof` (tải OWN/MGR + FD/FDL cho biên nhận tiền mặt; đọc OWN/MGR + người tải), `executeRefund.bankReference` bắt buộc khi chuyển khoản/POS, `attachmentId` bắt buộc khi chuyển khoản; **E15-03** `createVietQr.overBalanceReason` (FD+), `AMOUNT_EXCEEDS_BALANCE` hết "chờ DOM"; **E04-04** `PartyMemberCreate.effectiveFrom/applyExtraPersonSurcharge/expectedSurchargeVnd/dryRun/capacityWarningAckReason`, `Party.occupancyChange`, `Party.version` + `ETag` + `If-Match` cho `removePartyMember` – **`childAgeBand` không thêm**: dùng `priceAgeBand` có sẵn (cùng nghĩa); **E04-05** `changeRoom` `dryRun` → `ChangeRoomPreview`, `workOrderId`, `oldRoomVacated` (VD/OD), `applyDifference`+`expectedDeltaVnd`, dòng `room_change_difference`, đổi phòng đặt lại `doorAccessHandedOver=false`; **E05-09** `checkoutAt` (instant) ở `checkOut` + `getCheckoutSummary`; **E05-10** `CheckoutSummary.lateSurchargeRecalc`, `Bill.otaPrepaidVnd`, `refunds[]`, `refundedVnd` | BA s3-report, DOM G-4/G-10/G-12/G-13/G-16 |
| A-42 | **PO 16/10 – tách quyền theo phương thức tiền**: `executeCashRefund` (OWN/MGR/FDL/FD, **A47a**: nơi nhận `cash`, ≤ số duyệt còn lại, người chi ≠ người tạo → `403 SELF_REFUND_FORBIDDEN`, biên nhận `refund_proof` bắt buộc, vào ca); `executeRefund` chỉ `bank_transfer`/`original_method`, OWN/MGR (**A47**, đọc C3). `confirmCashHandover` (OWN/MGR/FDL/FD, **A46a**: `cash` do SAL/CTV ghi, `pending`; `result: received \| short`; người xác nhận ≠ người ghi, kể cả OWN); `reconcilePayment` giữ MGR+ (**A46**, sao kê). `listPayments` FD/FDL phạm vi `own_or_cash_handover`. Tên operation khớp đề xuất BA mục cuối file này | PO decision-log 16/10, rbac 0.2.3 |
| A-40 | `Payment.recordedByRole` + lọc `listPayments?recordedByRole=`; `ExtensionOptions.repricing[] {nights, repricedTotalVnd, deltaVnd, losDiscountPct}` (D-8); `cardsIssued` tối đa **2/căn** ở cả `checkIn` và `DoorCredentialInput` (DOM G-1, sửa 4 → 2); `listGuestRequestOptions.feeReason` + `lastFullCleanTime` (chỉ giờ); `resolveOverbookingExternal` sinh yêu cầu hoàn 100 % cọc `overbooking_relocated` (DOM BE-12) | UXD #3–#6, DOM G-1, BE-12 |

DOM không đổi hợp đồng: G-9 (hạn khai báo B9a theo `actualCheckinAt` – đã đúng; QA thêm ca 04:40 NN → 16:40), G-17 (trả sớm = trả phòng khi J16 tính hạn: `actualCheckoutAt` + `id_image_retention_days_after_checkout` – BE-C cài trong J16), G-6/7/8/11/16/19 (BA sửa spec, FE).

### 2.3 Còn mở (không chặn Sprint 3 bắt đầu)
| ID | Việc | Ai quyết | Phương án ARC |
|---|---|---|---|
| B-30 | ~~Ai tick tiền mặt sale/CTV nộp quầy~~ | **Đã đóng** – PO 16/10 → A-42 (`confirmCashHandover`, A46a) | – |
| B-31 | ~~FD chi hoàn~~ | **Đã đóng** – PO 16/10: tiền mặt FD+ (A47a, `executeCashRefund`), chuyển khoản OWN/MGR (A47) → A-42 | – |
| B-32 | `lastFullCleanTime` ở mức 1 | SEC (xem khi review 0.3.6) | Chỉ giờ, không ngày/tên – rủi ro thấp |
| B-33 | Nhóm B Sprint 4 còn lại (B-02…B-12, B-17…B-20, B-22…B-24) | – | Áp ở **0.3.7** đầu Sprint 4 (PO/DOM vẫn chờ B-06, B-10, B-12, B-22) |

## 3. Danh sách operation Sprint 3 (theo vùng)
| Vùng | Operation |
|---|---|
| **BE-A** – frontdesk, reservations, approvals, events, jobs | `previewCheckIn`, `checkIn`, `undoCheckIn`, `getExtensionOptions`, `extendStay`, `setLateCheckout`, `changeRoom`, `listCheckoutReminders`, `recordCheckoutConfirmation`, `getCheckoutSummary`, `checkOut`, `earlyDeparture` (Should), `updateReservation` (B-28), `listParty`, `addPartyMember`, `removePartyMember`, `cancelReservation`/`markNoShow`/`resolveOverbookingExternal` (B-13, BE-12), `updateRoom` (A-39), `listApprovalRequests`/`approveRequest`/`rejectRequest`/`cancelRequest` (loại mới `checkin_room_not_ready`, `late_checkout_conflict`, `damage_pricing`, `refund`), `streamEvents` (+2 sự kiện), `listMyNotifications` (+5 kind), `listAttentionItems` (`reconcile_overdue`, `refCode`/`params`) |
| **BE-B** – folio, payments, inventory, platform (tham số) | `getFolio`, `addFolioLine`, `adjustFolioLine`, `requestFoc`, `getChargeCatalog`, `getBill`, `setInvoiceRequest` (R2: lưu, MISA outbox R3), `recordPayment`, `listPayments`, `confirmPaymentReceived`, `reconcilePayment`, `confirmCashHandover`, `reversePayment`, `createVietQr`, `confirmDeposit` (B-29), `createRefundRequest`, `setRefundDestination`, `getRefundDestination`, `executeRefund`, `executeCashRefund`, `recordMinibarCheck`, `getMinibarStandard`, `setParameter` (`payment_receiving_account`) |
| **BE-C** – crypto, files, registration, guest-portal | `uploadAttachment`, `getAttachment`, `listRegistrations`, `getRegistration`, `addGuestDocument`, `updateGuestDocument`, `getGuestDocumentSensitive`, `getDocumentImage`, `purgeRegistrationImages`, `recordImageConsent`, `completeRegistrationReview`, `recordDocumentCheck`, `getPortalData`, `transitionRegistration`, `listC3AccessLog`, `issueGuestLink`, `revokeGuestLink`, `openGuestSession`, `getGuestStay`, `setGuestLocale`, `getOnlineCheckin`, `updateOnlineCheckin`, `uploadGuestDocument`, `recordGuestConsent`, `completeOnlineCheckin`; **không đăng ký** (ĐK-1): `sendGuestOtp`, `verifyGuestSession`, `getGuestFolio`, `withdrawGuestConsent`, `issueGuestVerificationCode`; job J16 |

## 4. Chia vùng code 3 BE
### 4.1 Module, thư mục, file dùng chung
| | BE-A | BE-B | BE-C (mới) |
|---|---|---|---|
| Module (`src/modules/`) | `frontdesk` (mới), `reservations`, `approvals`, `audit`, `events` (mới – hub SSE + notification + attention), `src/jobs/*` | `folio`, `payments`, `inventory` (mới), `platform` (chỉ phần tham số `payment_receiving_account`), `sales` | `crypto` (mới: `CryptoService`, `data_key`, KEK), `files` (mới: pipeline ảnh + `attachment`), `registration` (mới), `guest-portal` (mới) |
| Schema drizzle (`src/db/schema/`) | `frontdesk.ts` (mới), sửa `reservations.ts`, `approvals.ts` | sửa `folio.ts`, `sales.ts`; `inventory.ts` (mới) | `crypto.ts`, `files.ts`, `registration.ts`, `guest-portal.ts` (mới) |
| Migration | **0030–0039** `00NN_<slug>_be_a.sql` | **0040–0049** `_be_b.sql` | **0050–0059** `_be_c.sql` |
| Test | `test/frontdesk-*`, `test/integration/frontdesk*` | `test/folio-*`, `test/payments-*` | `test/crypto-*`, `test/files-*`, `test/registration-*`, `test/guest-portal-*` |

File dùng chung, chỉ **thêm dòng** (xung đột git chỉ là nối dòng): `src/db/schema/index.ts` (mỗi người một dòng `export * from`), `src/modules/feature-modules.ts` (mỗi người thêm module của mình dưới chú thích "Sprint 3 (BE-x)"), `src/jobs/*` đăng ký job (J16 do BE-C viết trong `registration/public/worker-jobs.ts`, BE-A chỉ thêm 1 dòng import). Ngoại lệ có chủ đích: `updateRoom` warnings (`platform`) do **BE-A** làm vì nối tiếp ĐK-S2-2 đang dở.

### 4.2 Số migration và `_journal.json` – cách tránh hỏng
Sự thật kỹ thuật (đã đọc `drizzle-orm` 0.45 `pg-core/dialect.js`): migrator lấy bản ghi **`created_at` lớn nhất** trong `drizzle.__drizzle_migrations` rồi chỉ chạy các entry có `when` (folderMillis) **lớn hơn**, theo **thứ tự mảng `entries`**. Vậy số trong tên file không quyết định thứ tự; nếu một migration được gộp sau mà mang `when` nhỏ hơn migration đã chạy trên staging thì nó **bị bỏ qua im lặng**. `drizzle-kit generate` song song từ cùng snapshot 0019 còn sinh chuỗi `prevId` rẽ nhánh.

Quy tắc Sprint 3 (bắt buộc):
1. **Dải số = không gian tên tệp**, không phải thứ tự: BE-A 0030–0039, BE-B 0040–0049, BE-C 0050–0059. 0020–0029 để đuôi Sprint 2 (nếu còn), theo thứ tự gộp. Hết dải → hỏi ARC.
2. **Viết SQL tay** (`--custom` / chép tay – coding-standards 6 cho phép, SQL là nguồn sự thật). **Không** chạy `drizzle-kit generate` trong Sprint 3 và **không** thêm `meta/00NN_snapshot.json` mới (tránh chuỗi `prevId` rẽ nhánh). Schema `.ts` vẫn sửa cho khớp SQL.
3. Entry journal: `idx` = vị trí trong mảng, `tag` = tên tệp bỏ `.sql`, `when` = `Date.now()` **lúc rebase lên main ngay trước khi gộp**, phải **lớn hơn** `when` của entry cuối trên main; `breakpoints: true`.
4. Xung đột `_journal.json` khi rebase: lấy nguyên mảng của main, **nối lại** entry của mình ở cuối, đánh lại `idx`, đặt lại `when = Date.now()`. Không bao giờ chèn vào giữa, không sửa entry đã gộp.
5. Migration đã gộp là bất biến (chỉ tiến); sửa = migration mới trong dải của mình.
6. FK chéo vùng: chỉ trỏ vào bảng **đã có trên main** (ví dụ `payment.approval_request_id → approval_request`). Cần bảng của người khác chưa gộp → gộp người kia trước, hoặc thêm FK ở migration sau.
7. Bảo vệ: BE-A thêm `test/migrations-journal.test.ts` (unit, không DB) – `when` tăng nghiêm ngặt theo mảng, `idx` = vị trí, mỗi `tag` có tệp và ngược lại, tiền tố thuộc dải cho phép, không trùng tiền tố. OPS thêm vào smoke staging: `count(__drizzle_migrations) = entries.length` sau `migrate` (bắt ca bị bỏ qua mà DB trắng không thấy).
8. ~~Cuối Sprint 3 (bước ổn định): BE-A chạy `drizzle-kit generate` **một lần** trên main để sinh snapshot gộp (phải ra migration rỗng – nếu không rỗng là schema `.ts` lệch SQL, sửa trước khi đóng sprint).~~ → thay bằng 4.2a (17/10).

#### 4.2a Sửa quy tắc 2 và 8 (ARC, 17/10/2026 – sau lỗi CI, ORC commit d71d7cf, a297273)
Sự thật kỹ thuật (đã đọc `drizzle-kit` 0.31.11, `prepareOutFolder`): `generate` lấy làm nền tệp `meta/*_snapshot.json` **đứng cuối theo thứ tự chữ** (`snapshots.sort()`), và dừng khi hai snapshot cùng `prevId` (collision). Bước CI "drizzle-kit generate không sinh tệp" vì thế so schema `.ts` với **snapshot đầu**. Quy tắc 2 cũ ("không thêm snapshot") làm snapshot 0019 tụt sau `.ts` → CI đỏ. Quy tắc mới (thay 2 và 8, áp từ Sprint 3 bước Phản hồi & sửa):

- **2a. Snapshot đầu đi cùng migration.** SQL vẫn viết tay và là nguồn sự thật. PR nào thêm migration thì **trong cùng PR** cập nhật snapshot đầu cho khớp `.ts`.
- **2b. Tên snapshot đầu = tiền tố LỚN NHẤT trong journal**, không phải migration vừa gộp. Hiện là `meta/0052_snapshot.json`. Ví dụ BE-A gộp `0031_…_be_a.sql` sau 0052 → **sửa** `0052_snapshot.json`; đặt `0031_snapshot.json` sẽ đứng trước 0052 theo thứ tự chữ, drizzle-kit bỏ qua nó và CI vẫn đỏ (hoặc nền sai). Migration mang tiền tố lớn nhất mới (ví dụ 0053) → tạo `0053_snapshot.json`, `prevId` = `id` của snapshot đầu cũ; tệp cũ giữ nguyên.
- **2c. Cách sinh** (không ghi SQL/journal vào repo): chép `src/db/migrations` ra thư mục tạm → `drizzle-kit generate` với `out` = bản sao → lấy snapshot vừa sinh. Ghi đè snapshot đầu nhưng **giữ nguyên `id`, `prevId`** của tệp đích (chỉ thay phần bảng/enum/…). Chạy `prettier --write` cho tệp (như a297273).
- **2d. Xung đột snapshot khi rebase**: lấy bản của main rồi **sinh lại** theo 2c. Không trộn JSON bằng tay.
- **2e. Đối tượng chỉ có trong SQL** (drizzle không biểu diễn được): FK `DEFERRABLE` (`reservation_folio_fk`, `folio_primary_reservation_fk`, `minibar_check_replaced_by_fk`), EXCLUDE `room_occupancy_no_overlap`, chỉ mục trgm/gist (`guest_name_search_trgm_idx`, `room_occupancy_active_range_idx`), `room_occupancy_range_check`, FK chéo module của 0014, RLS/GRANT/REVOKE, trigger, hàm `SECURITY DEFINER`, bảng phân vùng. Snapshot thiếu chúng là **đúng**. Không thêm vào `.ts` chỉ để "cho khớp", không xóa khỏi SQL.
- **9. Kiểm SQL ↔ `.ts` (mới, thay ý "migration rỗng" của quy tắc 8).** Từ nay cả `.ts` lẫn snapshot đều sinh từ `.ts`. Bước CI chỉ còn bắt "sửa `.ts` mà quên snapshot", **không** bắt "SQL viết tay lệch `.ts`". Vì vậy BE-A thêm `test/integration/schema-parity.test.ts` (thẻ FB-R2-ARC-BE-S3-21). Sau `migrate`, test đọc `pg_catalog`: bảng; cột (kiểu, NOT NULL); tên và thân chuẩn hóa của CHECK; tên FK/UK/chỉ mục. Rồi so với snapshot đầu. Danh sách 2e là ngoại lệ đặt cứng trong test, mỗi mục kèm lý do.

**ARC kiểm tĩnh 17/10** – so snapshot `0052` với SQL 0000–0052:
- Bảng: 61/61 khớp.
- CHECK của 0030–0052: thân chuẩn hóa trùng hoàn toàn, **0 lệch**, gồm `payment_reconcile_separation_check`, `payment_refund_not_requester_check`, `approval_request_refund_no_self_approval`, `data_key_destroyed_check`, `reservation_guest_subject_check`.
- Khác biệt chỉ thuộc nhóm 2e.
- `minibar_check_replaced_by_fk` vẫn `DEFERRABLE INITIALLY DEFERRED` trong 0041.
- `reservation_folio_fk` / `folio_primary_reservation_fk` vẫn `DEFERRABLE INITIALLY DEFERRED` trong 0014.
- `room_occupancy_no_overlap` vẫn `DEFERRABLE INITIALLY IMMEDIATE`.

→ ERD (DEFERRABLE, CHECK) còn đúng. Chuỗi snapshot liền mạch: `0052.prevId` = `0019.id`.

### 4.3 Cổng public giữa module (ngày 1: mỗi BE gộp interface + bản giả/no-op trước khi cài)
| Cổng (`modules/<x>/public/…`) | Chủ | Người gọi | Hàm |
|---|---|---|---|
| `crypto/public/crypto.service.ts` | BE-C | BE-B (refund account), BE-C | `encrypt(tx, {purpose, subjectId, aad}, plaintext)`, `decrypt`, `destroy(tx, dekId)` – module khác không import `data_key`/KEK (lint) |
| `files/public/attachment.service.ts` | BE-C | BE-B (`attachmentId`, `evidenceAttachmentIds`, `executeRefund`), BE-A (sau Sprint 4) | `assertUsable(tx, actor, id, purpose, {reservationId})` → 422 `NOT_IN_LIST`; `bindTo(tx, id, ref)` |
| `files/public/image-pipeline.ts` | BE-C | registration, guest-portal | `normalize(buffer)` (magic bytes, sharp, 40 MP, EXIF) |
| `registration/public/registration.port.ts` | BE-C | BE-A frontdesk/reservations | `checkinDocumentStatus(tx, reservationId)` → `main_guest_document`, `document_check_block`, `pending_online_checkin`, cảnh báo thị thực; `onPartyMemberRemoved`, `onPartyChanged`, `onCheckedIn(actualCheckinAt)`, `onCheckedOut/onEarlyDeparture(actualCheckoutAt)`, `onReservationVoided` |
| `guest-portal/public/guest-access.port.ts` | BE-C | BE-A (B5/B10/B11, `resolveOverbookingExternal`) | `revokeAllForReservation(tx, reservationId)` – thay no-op B-13 |
| `folio/public/folio.service.ts` (có sẵn, mở rộng) | BE-B | BE-A | `postLines(tx, …)`, `reverseLine(tx, lineId, reason)`, `balance(tx, folioId)` → `{totalVnd, paidVnd, balanceDueVnd, creditVnd}`, `settle(tx, folioId)` cấp số bill |
| `payments/public/payment.service.ts` (có sẵn) | BE-B | BE-A (`checkOut.finalPayment`, `checkIn` thu tại quầy) | `recordInTx(tx, actor, folioId, PaymentCreate)` |
| `approvals/public/approval.service.ts` (có sẵn) | BE-A | BE-B, BE-C | `submit(tx, …)` (loại `refund` với `amountVnd`), hook `onApproved(type, handler)` – BE-B đăng ký cho `refund` (gửi `refund_ready`), `damage_pricing` |
| `events/public/events.service.ts` | BE-A | mọi module | `publish(tx, type, id)` (sau commit), `notify(tx, kind, recipients, ref)`, `attention.open/resolve` |
| `reservations/public/*` (có sẵn) | BE-A | BE-B, BE-C | đọc đơn **có `actor`** (`loadReservation(tx, id, actor)` – SEC H2 trước khi thêm đường gọi mới) |

Không gọi thẳng bảng của vùng khác; truy vấn đọc tổng hợp (rack, KPI) do chủ module expose qua public.

## 5. Bảng việc theo vai (0.3.6) – kèm mục [CHẶN] của SEC `s3-checklist.md`
SEC viết checklist theo cách chia cũ (giấy tờ C3 = BE-B). Theo phân vùng mục 4, **mục B, C1–C5, E, G (phía server), I của SEC chuyển sang BE-C**; F sang BE-B; A, D, H2, H4 (A3) sang BE-A. Mục A1, A2 áp cho cả ba.

| Vai | Việc | [CHẶN] SEC phải đạt |
|---|---|---|
| **BE-A** | Module `frontdesk` (B9/B9a/B13/B14/B15/B16/B17/B18; `checkoutAt` E05-09; `changeRoom` dryRun/preview E04-05; party E04-04 `effectiveFrom`/`occupancyChange`/`Party.version`), A-30, A-32 (G-10 đảo + ghi lại phụ thu; gọi `FolioPort`), A-34 (`credit_balance`, `overpaymentHandling` → `approvals.submit refund`), A-37, A-38, B-13 (gọi `GuestAccessPort`), B-28, DOM BE-12, A-39 (`updateRoom.warnings`, ~0,5 ngày), A-35/A-36 hub SSE + notification, B-21 `reconcile_overdue` + `params` allowlist; `migrations-journal.test.ts`; migration 0030+ (`door_access_handed_over_*`, `deposit_shortfall_*` nếu BE-B không làm – xem dưới) | A1, A2, **A3** (`setLateCheckout` dryRun `readOnly`), **D1** (C3 trong nhận phòng chỉ thiết bị được cấp), **D2** (mã cửa không có trong `Reservation`/`checkIn`/SSE/push/audit – R2 không gọi `setDoorCredential`), **H2** (sales-port nhận `actor` trước khi thêm đường gọi) |
| **BE-B** | Folio/bill (G-12, G-13), A-29 (tham số + `createVietQr` 3 trường + push), A-33/A-41/A-42 (`createRefundRequest`, `setRefundDestination`/`getRefundDestination`, `executeRefund` (chuyển khoản), `executeCashRefund` (tiền mặt, vào ca), `confirmCashHandover`, `overBalanceReason`, cột `approval_request.refund_*`, `payment.approval_request_id`; CHECK DB người chi ≠ người tạo, người xác nhận ≠ người ghi), bill E05-10, A-40 (`recordedByRole` cột snapshot + lọc), B-29 (`acceptShortfallReason`, cột `reservation.deposit_shortfall_*` – BE-B viết migration vì logic ở `confirmDeposit`), minibar (`inventory`), `listPayments`/đối soát; migration 0040+ | A1, A2, **F1** (số tiền VietQR do server, nội dung chỉ mã), **F2** (QR vẽ tại chỗ, không dịch vụ ngoài), **F3** (tài khoản nhận: OWN + reauth + audit + push + cảnh báo 24 giờ), **F5** (đối soát ≠ người ghi ≠ người xác nhận, `FOR UPDATE` + CHECK DB), **F8** (hoàn qua `approval_request`, CHECK người tạo ≠ người duyệt, số hoàn ≤ đã thu − đã hoàn, `refund_account_enc` DEK riêng, hủy DEK khi xong, đổi nơi nhận → duyệt lại) |
| **BE-C** | Module `crypto` (**ngày 1–2, đường găng** – BE-B cần cho F8), `files` (pipeline + B-01 + thời hạn I5 trong J16), `registration` (K1…K12, đối chiếu, khai báo, J16 hằng giờ gồm G-17 "trả sớm = trả phòng"), `guest-portal` (link, phiên mức 1, check-in online, `online_checkin_completed`, `registration.changed`); thay no-op `GuestAccessPort`; migration 0050+ (`data_key`, `attachment` cột mới, bảng registration/guest_document/document_image/online_checkin/guest_access_token/guest_session/consent, `purge_journal`, `retention_run`) | A1, A2, **B1** (`CryptoService` duy nhất, AES-256-GCM, AAD, DEK riêng, lint import), **B2** (`_enc`+`_hmac`+`last4`; snapshot JSON 8 vai), **B3** (thứ tự thiết bị → step-up → quyền → lý do → log → dữ liệu; lỗi log → 503), **C1** (pipeline dùng chung), **C2** (blob mã hóa, quyền 600/700, không qua Caddy), **C5** (xóa = hủy DEK + blob + log purge + `purge_journal`), **E1** (`getPortalData` mỗi lần lấy = 1 dòng `view` trước khi trả), **G1** (không đăng ký 5 route ĐK-1), **G2** (JSON mức 1 không có `guestFullName`/`doorCode`; allowlist khóa `OnlineCheckin`), **G4** (token 256 bit băm, rời URL, thu hồi, 401/403) |
| **FE** | S06 nhận phòng, S07 trả phòng 3 bước, S08 lưu trú, S09/K3–K10 giấy tờ, đối soát H16.6, ô ảnh biên nhận (bỏ ẩn A-17), cảnh báo `FUTURE_RESERVATIONS_KEEP_ROOM`, `credit_balance` + hộp chọn `overpaymentHandling`, màn chi hoàn (MGR), `repricing[]`, `doorAccessHandedOver`, cảnh báo "Tài khoản nhận vừa đổi"; regen api-client đã xong | **C4** (watermark, không nút tải, thu hồi object URL), **D1/D4**, **E2**, **F2** (vẽ QR trong bundle, CSP `img-src 'self' blob: data:`), B5 (số đầy đủ ẩn 60 giây/ẩn tab) |
| **MOB** | guest-web check-in online (bước 0–3, mở lại, lỗi, ngôn ngữ) | **G1**, **G3** (không lưu ảnh/số ở storage), **G4** (token rời URL), **G5** (CSP), G6–G8 |
| **INT** | VietQR: không dùng API/ảnh bên thứ ba (F2); `scrubCardData` cho mock VNPay/MoMo (F10); hỗ trợ BE-B dựng `qrPayload` EMVCo (CRC16) | F2 |
| **OPS** | Smoke staging `count(__drizzle_migrations) = entries.length` (mục 4.2-7); H3 vai DB; cảnh báo J16 không chạy 26 giờ (C6); Caddy không phục vụ volume tệp (C2), body 25 MB | C2 (phần Caddy) |
| **QA** | Ca mới: A-42 (FD chi hoàn tiền mặt chính yêu cầu mình tạo → 403 `SELF_REFUND_FORBIDDEN`; FD gọi `executeRefund` → 403; người ghi tự `confirmCashHandover` → 403, kể cả OWN), E04-05 dryRun không ghi, E05-09 trả 01:00 hôm sau → 422, A-33 (tự duyệt → 403, vượt số duyệt → 422, đổi nơi nhận sau duyệt → `pending`), A-34 (`credit_balance`), G-10 (hẹn 17:00 trả 13:00 → 30 %), G-12/G-13 bill, G-9 (B9a 04:40 NN → hạn 16:40), A-37 (đổi phòng vượt sức chứa → 422), A-39, B-28 (lần 2 → 409), B-29 (FD → 403), SEC A3 (dryRun không ghi), getAttachment 404 ngoài phạm vi; seed `payment_receiving_account` (giá trị thử, không phải tài khoản thật); `rbac-cases` đã sinh lại (186 op) | Bộ test SEC theo cột "Test tối thiểu" |
| **BA** | Sửa spec theo 2.2 (EP03-05 2.4/2.5 thêm "Chi hoàn", 5.3–5.5 G-10/G-13/G-15; EP02 mục 8; EP06 6.1 G-17); chốt B-30 (rbac A46), B-31 (A47) với DOM | – |
| **SEC** | Review 0.3.6 (A-29, A-33, B-01 áp đúng điều kiện chưa; B-32) | – |

## 6. Giả định, rủi ro
- Giả định: hoàn tiền (US-123 R3) được kéo phần **chi hoàn tối thiểu** vào Sprint 3 vì B10 có cọc/trả sớm/dời ra ngoài/trả thừa đều sinh yêu cầu `refund` (DOM G-14). Hoàn qua cổng (VNPay/MoMo) vẫn R3 (`original_method` chỉ ghi nhận).
- Giả định: `retain_with_guest_consent` ghi `deposit_forfeit` (R2 không có ví tín dụng khách) – DOM xác nhận khi review.
- Rủi ro: `crypto` là đường găng của BE-C và BE-B (F8). Nếu BE-C trễ quá ngày 2, BE-B làm `setRefundDestination` sau cùng; `executeRefund` với `cash` không cần C3 nên làm trước.
- Rủi ro: ba người cùng nối `schema/index.ts`, `feature-modules.ts`, `_journal.json` – theo đúng mục 4.2; test journal chặn lỗi im lặng.
- Không có ESC mới (mọi mục trong quyền ARC hoặc đã chuyển BA/DOM/SEC).

---

## BA – ánh xạ A46a/A47a (B-30, B-31) – BA ghi theo yêu cầu ORC, 16/10/2026 (ARC xác nhận/sửa trong mục này)

Căn cứ: PO quyết 16/10 (decision-log: Q-S3-1; đối soát tiền mặt sale/CTV nộp quầy theo ESC-017 A). `rbac-matrix.md/.json` **0.2.3** đã thêm **A46a**, **A47a** (ghi chú 38); A46, A47 giữ MGR+. Hai hành động mới hiện **chưa có `operationIds`** trong JSON. Lý do: tránh làm `gen_traceability --strict` lệch cho tới khi 0.3.6 có operation tương ứng. Ngay khi ARC chốt tên, BA điền vào JSON.

| Hành động rbac | Vai | Đề xuất BA – **tách operation** (ARC đang tách) | Phương án thay thế (giữ một operation) | Ràng buộc server (cả hai phương án) |
|---|---|---|---|---|
| **A46a** – xác nhận đã nhận tiền mặt SAL/CTV nộp quầy | OWN, MGR, FDL, FD | `confirmCashHandover` `POST …/payments/{paymentId}/actions/confirm-cash-handover`; body `{result: received\|short, receivedAmountVnd?, note?}`; `x-rbac: [A46a]`; `x-roles: [owner, manager, front_desk_lead, front_desk]` | `reconcilePayment` thêm `x-scope {front_desk_lead: cash_handover_only, front_desk: cash_handover_only}`, `x-rbac: [A46, A46a]` | `method = cash` **và** `recordedByRole ∈ {sales_staff, collaborator}` **và** `reconciliation = pending`; người xác nhận ≠ `recordedBy` → 403 `SELF_RECONCILE_FORBIDDEN` (kể cả OWN `[GIẢ ĐỊNH BA – tiền mặt cần người thứ hai]`); `short` → `disputed` + cảnh báo MGR/OWN; `received` → hoa hồng người ghi "đạt" (BR-527) |
| **A46** (giữ) – đối soát chuyển khoản/VietQR với sao kê | OWN, MGR | `reconcilePayment` chỉ cho `method ∈ {vietqr, bank_transfer}` (và `cash` do FD ghi nếu cần – MGR+) | – | Như 0.3.3 |
| **A47a** – chi hoàn tiền mặt tại quầy (đã duyệt) | OWN, MGR, FDL, FD | `executeCashRefund` `POST …/approval-requests/{approvalId}/actions/execute-cash-refund`; body như `executeRefund` (`amountVnd`, `paidAt`, `attachmentId` **bắt buộc** – ảnh biên nhận có chữ ký khách, `note`); `x-rbac: [A47a]` | `executeRefund` `x-roles` thêm FDL/FD, `x-scope {front_desk_lead: cash_only, front_desk: cash_only}`, `x-rbac: [A47, A47a]` | Yêu cầu `refund` `approved`, nơi nhận `method = cash`; ≤ số duyệt − đã chi (`REFUND_EXCEEDS_APPROVED`); người chi ≠ người **tạo** yêu cầu (`requestedBy`) → 403 (đề nghị mã `SELF_REFUND_FORBIDDEN`); không cần thiết bị được cấp, không đọc D15; giao dịch vào đóng ca (BR-526) |
| **A47** (giữ) – chi hoàn chuyển khoản / phương thức gốc | OWN, MGR | `executeRefund` chỉ cho nơi nhận `bank_transfer`/`original_method`; FD/FDL → 403 | – | Như 0.3.6 A-33 |

Thêm: `listPayments` cần phạm vi để FD/FDL thấy **mọi** khoản `cash` do SAL/CTV ghi đang chờ (không chỉ của mình) – gợi ý `x-scope {front_desk_lead: own_or_cash_handover, front_desk: own_or_cash_handover}`.

**ARC trả lời (16/10)**: chấp nhận **tách operation** đúng tên BA đề xuất – `confirmCashHandover` (body `{result, receivedAmountVnd?, note?}`), `executeCashRefund` (`attachmentId` bắt buộc), mã `SELF_REFUND_FORBIDDEN` (403); `executeRefund` chỉ `bank_transfer`/`original_method`; `listPayments` x-scope `own_or_cash_handover` cho FD/FDL. Đã áp vào 0.3.6; `gen_traceability --strict` xanh với rbac 0.2.3. BA điền `operationIds`: A46a → `confirmCashHandover`, A47a → `executeCashRefund`, A43 → `createRefundRequest`, `setRefundDestination`; A47 → `executeRefund`, `getRefundDestination`; A46 → `reconcilePayment`.

BA nghiêng về **tách operation** vì hai lý do. (1) `x-rbac` một mã/operation → `gen_rbac_cases` sinh ca 403 đúng cho FD gọi chuyển khoản mà không cần luật scope riêng. (2) Khớp hướng ARC đang tách. Sau khi ARC chốt: BA điền `operationIds` cho A46a/A47a, chạy lại `gen_traceability --strict`; ARC/QA sinh lại `rbac-cases`. Đặc tả: `specs/EP03-05-stay.md` 2.1, 2.4, 2.6.3 (E15-04).

**Cập nhật BA (16/10, sau khi ARC áp 0.3.6):**
- ARC đã dùng đúng tên đề xuất: `confirmCashHandover` (A46a) và `executeCashRefund` (A47a).
- BA đã điền `operationIds` vào `rbac-matrix.json` 0.2.3.
- Đặc tả đã chỉnh theo hợp đồng ARC:
  - `receivedVnd` phải bằng số đã ghi; nếu nhận thiếu tiền thì MGR ghi `disputed`, không dùng `short`.
  - Tự chi khoản hoàn do mình tạo → `403 SELF_APPROVAL_FORBIDDEN`.
- Kiểm tra: `gen_rbac_cases --check` OK (189 operation, mismatch []); `gen_traceability --strict` exit 0.
- Còn mở: phạm vi `listPayments` để FD/FDL thấy mọi khoản tiền mặt SAL/CTV chờ nộp.

---

## 7. Thay đổi hợp đồng cho bước Phản hồi & sửa Sprint 3 – OpenAPI 0.3.6 bổ sung 1 + 2 (ARC, 17/10/2026)

**Nguồn:**
- Bổ sung 1: `reviews/s3-ARC.md` mục C.
- Bổ sung 2: BA `specs/EP03-05-stay.md` v0.3 mục 7 (E03-07, E04-06, E04-07, E05-11, E15-05) và `responses/s3-BA.md`, DOM s3 (BE-13, BE-14, BE-21, S3-1…S3-16), UXD FB-R2-UXD-FE-S3-09, SEC s3 mục 4 b.

Mọi thay đổi là **thêm**, trừ 5 thay đổi hành vi có chủ đích ở bảng 7.1. Đã sinh lại `openapi-meta.ts`, `openapi-schemas.ts` và api-client.

### 7.1 Đổi hành vi – bên gọi phải sửa cùng lúc
| # | Operation | Trước | Từ nay | Ai sửa |
|---|---|---|---|---|
| 1 | `earlyDeparture` 200 | `Reservation` | **`EarlyDepartureResult`** `{reservation, earlyDepartureFeeVnd, refundVnd?, refundRequestId}`. Serializer cắt theo schema mới, nên phản hồi cũ sẽ mất trường cho tới khi BE-A sửa | BE-A (FE chưa làm màn B16) |
| 2 | `checkOut` khi giờ trả sau mốc cuối BR-412 | 422 `LATE_CHECKOUT_AFTER_LIMIT` (bắt gia hạn trước) | Phải gửi `extraNight {rateVnd}`. Thiếu thì vẫn 422 `LATE_CHECKOUT_AFTER_LIMIT` nhưng `field` = `extraNight`. Thêm đêm + B18 trong một giao dịch, không phụ thu trả muộn | BE-A, FE |
| 3 | `changeRoom.effectiveDate` | hôm nay … ngày đi − 1 | Chỉ nhận **hôm nay**; khác → 422 `DATE_INVALID` (mã chính thức – BA bỏ `VALUE_OUT_OF_RANGE`) | BE-A, BA |
| 4 | `recordGuestConsent` / `recordImageConsent` (`ConsentInput`) P02b | không có `retentionDays` | `retentionDays` **bắt buộc** với `P02B_ID_IMAGE_RETENTION` (thiếu → 422 `REQUIRED`). Khác tham số → 422 `NOT_IN_LIST` | BE-C, MOB, FE (H14) |
| 5 | Ghi tiền vượt còn phải thu | mã trường `AMOUNT_TOO_HIGH` (ngoài hợp đồng) | `AMOUNT_EXCEEDS_BALANCE` kèm `max` | BE-B, FE |

### 7.2 BE-A (frontdesk, reservations, events)
| Operation / schema | Thay đổi | Mã lỗi |
|---|---|---|
| `checkIn` | Thêm `checkinTimeNote`. **Cửa sổ B9a**: bỏ qua `checkinTime`, bắt buộc `addPriorNight` (thẻ S3-07). Phụ thu > 0 mà không quyết → lỗi | 422 `TIME_AFTER_ACTION`, `TIME_NOTE_REQUIRED`, `SURCHARGE_DECISION_REQUIRED`; 409 `INVALID_TRANSITION` (`availableFrom`) |
| `checkOut` | Thêm `extraNight`, `checkoutTimeNote`.<br>• Cửa sổ sau nửa đêm (B18/B16 hợp lệ, phụ thu 0).<br>• Ngày đi gộp đơn chính + con.<br>• Yêu cầu vận hành tự `superseded`; chỉ yêu cầu tiền chặn.<br>• `overpaymentHandling` theo `unhandledCreditVnd` – không tạo hoàn trùng.<br>• Audit `reservation.extra_night_on_checkout` | 422 `LATE_CHECKOUT_AFTER_LIMIT` (`extraNight`), `RATE_OUT_OF_RANGE`, `TIME_*`, `SURCHARGE_DECISION_REQUIRED`; 409 `ROOM_UNAVAILABLE` |
| `getCheckoutSummary` → `CheckoutSummary` | `unhandledCreditVnd`, `extraNightRequired`, `extraNightDefaultRateVnd`, `extraNightAvailable`, `postMidnightWindow`. `blockers.credit_balance` tính theo `unhandledCreditVnd`. `pendingApprovals` chỉ đếm yêu cầu tiền | – |
| `earlyDeparture` | Thêm `otaRetainedVnd` (OTA bắt buộc, kênh khác → `NOT_ALLOWED`), `noticeEvidence {note, attachmentId}` (ảnh `penalty_evidence`). Phản hồi `EarlyDepartureResult`. Cơ sở tính = giá ròng (DOM S3-2) | 422 `REQUIRED`, `NOT_ALLOWED`, `VALUE_OUT_OF_RANGE`, `EVIDENCE_REQUIRED` (`noticeEvidence`) |
| `getExtensionOptions` → `ExtensionOptions` | Thêm `currentBookingRateVnd` (null = theo lịch giá) | – |
| `changeRoom` | `effectiveDate` = hôm nay | 422 `DATE_INVALID` |
| `Reservation` (DTO) | Thêm `depositShortfall {shortfallVnd, acceptedAt, acceptedByName, reason} \| null` từ cột 0040 | – |
| `listAuditEvents` / `AuditEvent.action` | Nhóm `money` là **tập đóng** (danh sách trong mô tả `AuditEvent.action`). Thêm test: mọi `recordMoney` ∈ danh sách | – |

### 7.3 BE-B (folio, payments)
| Operation / schema | Thay đổi | Mã lỗi |
|---|---|---|
| `Folio.totals` | `unhandledCreditVnd`, `otaExcessVnd`. `creditVnd` không gồm phần dư từ `ota_collect`. Quy tắc `x-ota-prepaid-rule` (DOM BE-13): đơn `ota_prepaid` có **một** `ota_collect` hệ thống = tiền phòng OTA còn hiệu lực, tự điều chỉnh khi đêm đổi | – |
| `FolioLine` (getFolio, CheckoutSummary, Bill) | `labelKey` (`bill.line.*`, kể cả `extra_night`) + `labelParams`. `description` chỉ dùng cho nhật ký | – |
| `Bill` | `creditVnd`. `ota_prepaid`: `totalVnd`/`paidVnd` chỉ khoản tại quầy | – |
| `executeRefund`, `executeCashRefund` | ≤ `creditVnd` hiện tại. Phần thừa từ khoản thu chưa đối soát → chặn | 409 `REFUND_SOURCE_NOT_RECONCILED` (`paymentIds[]`, `unreconciledVnd`); 422 `REFUND_EXCEEDS_APPROVED` |
| `createRefundRequest` | Trần = `unhandledCreditVnd` | 422 `REFUND_EXCEEDS_APPROVED` |
| `recordPayment`, `checkOut.finalPayment`, `confirmDeposit.payment` | `AMOUNT_TOO_HIGH` → `AMOUNT_EXCEEDS_BALANCE` | 422 |
| `adjustFolioLine` | `If-Match` = `Folio.version`. Dòng `room`/`extra_person` phải ghi lại giá đêm (thẻ S3-14) | – |
| `setRefundDestination`, `addFolioLine` | Mã trường `NOT_ALLOWED` đã có trong bảng | – |

### 7.4 BE-C, MOB, FE
- **BE-C**:
  - `OnlineCheckin.currentNoticeVersion`, `imageRetentionDays` có ở mọi phản hồi `OnlineCheckin` (khóa cho phép 9 → 11, SEC ĐK-2).
  - `ConsentInput.retentionDays` (7.1-4). `consent_record.retention_days` qua migration 0053 (erd); J16 T02 dùng min.
  - `PortalData`: `label` có pattern, `value` gắn D03, định dạng theo tham số DOM S3-5 (ESC-018) – một cài đặt duy nhất (thẻ S3-20).
- **MOB**: dùng hai trường `OnlineCheckin` mới, bỏ hằng phiên bản/30 ngày; thiếu trường thì không hiện câu đồng ý; gửi `retentionDays`.
- **FE**:
  - `Reservation.depositShortfall` (câu `ci.shortfall_accepted`).
  - Trả phòng: `extraNight*`, `postMidnightWindow`, `unhandledCreditVnd`, `checkoutTimeNote`. Nhận phòng: `checkinTimeNote`.
  - Mã `TIME_AFTER_ACTION`, `TIME_NOTE_REQUIRED`, `SURCHARGE_DECISION_REQUIRED`, `REFUND_SOURCE_NOT_RECONCILED`, `AMOUNT_EXCEEDS_BALANCE`.
  - Bill/folio hiện theo `labelKey`. H14 gửi `retentionDays`.
  - Nhật ký tiền: bảng `mlog.a_*` theo tập đóng `AuditEvent.action`.
  - Gia hạn: nút "Giữ giá đơn" (`currentBookingRateVnd`).

### 7.5 Không đổi / dời
- **0.3.7 (đầu Sprint 4):**
  - `Reservation.availableOperations`.
  - `getGuestSession` (SEC đã duyệt cách làm).
  - `updateOnlineCheckin.deferredPeople`.
  - Mã 403/404/409/422 còn thiếu ở `recordPayment`/`reversePayment`.
  - `Payment.receivedAmountVnd`/`selfReconciled`.
  - `getBill?locale=vi_en` (UXD FE-S3-06).
  - `ApprovalRequest.requestedById` (UXD).
- `checkoutAt` (E05-09) **giữ**: vẫn là cách nói giờ trả thực tế, nay đi cùng cửa sổ sau nửa đêm và `extraNight`.

### 7.6 Kiểm tra (17/10, trên tệp thật)
| Kiểm tra | Kết quả |
|---|---|
| `openapi-spec-validator` | OK |
| `gen-openapi-meta.mjs --check` | up to date |
| api-client `gen.mjs --check` | up to date |
| `gen_rbac_cases --check` | 189 op, mismatch [] |
| `gen_traceability --strict` | exit 0 |
| `vitest test/contract.test.ts` | 5/5 |
| `tsc` api-client, admin-web, guest-web | 0 lỗi |
| prettier (openapi + tệp sinh) | xanh |

`tsc` của `@ottimo/api` đang đỏ ở `registration/internal/registration.service.ts:524,659` (TS1109). Đó là tệp BE-C đang sửa dở, không liên quan hợp đồng; các tệp sinh không gây lỗi.
