// Page copy of every published language (lib/i18n.ts LANGS) – one map for the [lang] routes, the language suggestion
// strips and the tests. Adding a language = add its file here (a missing one is a type error).
import type { Lang } from '../lib/i18n';
import { en } from './en';
import { ko } from './ko';
import { ru } from './ru';
import type { Copy } from './types';
import { vi } from './vi';
import { zh } from './zh';

export const COPY: Record<Lang, Copy> = { en, vi, ko, zh, ru };
