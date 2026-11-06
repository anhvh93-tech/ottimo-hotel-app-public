/**
 * The keyring's start-up error class for code outside the crypto module (SR-KEY-02: no import of crypto internals).
 * main.ts prints its message on a failed start (SEC FB-R5-SEC-BE-D1-01): every KeyringError message is written in
 * keyring.ts with variable names, sizes and versions only – never a key.
 */
export { KeyringError } from '../internal/keyring';
