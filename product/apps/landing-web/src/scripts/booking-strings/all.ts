// Every language at once – tests and build-time checks only (the page uses ./index.ts loadBookingStrings).
import type { Lang } from '../../lib/langs';
import en from './en';
import ko from './ko';
import ru from './ru';
import type { BookingStrings } from './types';
import vi from './vi';
import zh from './zh';

export const BOOKING_STRINGS: Record<Lang, BookingStrings> = { en, vi, ko, zh, ru };
