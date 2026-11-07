#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kiểm bộ so chữ tờ in / trang khách (check_print_notice.py, V5-47): khớp thì xanh, lệch thì đỏ và chỉ đúng chỗ.

Chạy từ gốc repo (CI chạy trong product/):
    python3 -I product/design/tools/tests/test_check_print_notice.py -v
Mỗi ca chép nguồn thật (one-pager, HTML Tờ 4, strings-*.json, config.ts, i18n.tsx) vào thư mục tạm rồi sửa bản chép.
Không sửa tệp nào của repo. Chỉ dùng thư viện chuẩn Python 3.9+.
"""
import contextlib
import io
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True  # không để lại __pycache__ trong repo
TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))
import build_print_sheets as bps  # noqa: E402
import check_print_notice as cpn  # noqa: E402

NBSP = " "


class Fixture:
    """Bản chép các nguồn thật trong thư mục tạm; sửa bằng replace() đúng một chỗ."""

    def __init__(self, root):
        self.root = Path(root)
        self.md = self.root / "staff-one-pager.md"
        self.print_dir = self.root / "print"
        self.copy_dir = self.root / "copy"
        self.config = self.root / "config.ts"
        self.i18n = self.root / "i18n.tsx"
        shutil.copy(cpn.DEFAULT_MD, self.md)
        self.print_dir.mkdir()
        for j in cpn.notice_jobs():
            shutil.copy(cpn.DEFAULT_PRINT / (j["file"] + ".html"), self.print_dir)
        self.copy_dir.mkdir()
        for lang in cpn.LANGS:
            shutil.copy(cpn.DEFAULT_COPY / ("strings-%s.json" % lang), self.copy_dir)
        shutil.copy(cpn.DEFAULT_CONFIG, self.config)
        shutil.copy(cpn.DEFAULT_I18N, self.i18n)

    def replace(self, path, old, new, count=1):
        text = Path(path).read_text(encoding="utf-8")
        self_count = text.count(old)
        if self_count < count:
            raise AssertionError("fixture: %r found %d times in %s" % (old, self_count, path))
        Path(path).write_text(text.replace(old, new, count), encoding="utf-8")

    def html(self, name):
        return self.print_dir / ("to-4-your-id-details-%s.html" % name)

    def args(self):
        return ["--md", str(self.md), "--print-dir", str(self.print_dir), "--copy-dir", str(self.copy_dir),
                "--guest-config", str(self.config), "--guest-i18n", str(self.i18n)]

    def run(self):
        problems, copies, _ = cpn.run(self.md, self.print_dir, self.copy_dir, self.config, self.i18n)
        return problems, copies

    def main(self):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = cpn.main(self.args())
        return code, out.getvalue()


class CheckPrintNotice(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory(prefix="ottimo-v547-")
        self.f = Fixture(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def assertOnly(self, problems, *needles, count=None):
        text = "\n".join(problems)
        for n in needles:
            self.assertIn(n, text)
        if count is not None:
            self.assertEqual(len(problems), count, text)

    # ------------------------------------------------------------------ khớp

    def test_repo_sources_match(self):
        problems, copies, page = cpn.run()
        self.assertEqual(problems, [])
        # 2 phần Markdown + 5 tờ HTML (A5, A4, A4 hai bản = 2, A4 EN/RU)
        self.assertEqual(len(copies), 7)
        self.assertEqual(page["paragraphs"][0], "gw.notice_body")

    def test_copy_matches_and_exits_0(self):
        code, out = self.f.main()
        self.assertEqual(code, 0, out)
        self.assertIn("KHỚP: 7 tờ", out)

    def test_nobreak_span_is_not_a_difference(self):
        # Tờ HTML bọc "3 months" trong <span class="nb">; trang không có thẻ đó.
        self.assertIn('<span class="nb">3 months</span>', self.f.html("a4").read_text(encoding="utf-8"))
        problems, _ = self.f.run()
        self.assertEqual(problems, [])

    # ------------------------------------------------------------------ lệch chữ

    def test_word_changed_on_sheet_source_fails_with_diff(self):
        self.f.replace(self.f.md, "3 tháng sau khi trả phòng", "3 tuần sau khi trả phòng")
        code, out = self.f.main()
        self.assertEqual(code, 1, out)
        self.assertIn("LỆCH CHỮ  %s · Tờ 4 · vi · gw.notice_retention" % cpn.rel(self.f.md), out)
        self.assertIn("[-tháng-] {+tuần+}", out)
        self.assertIn("LỆCH: 1 chỗ", out)

    def test_page_text_changed_fails_every_sheet(self):
        self.f.replace(self.f.copy_dir / "strings-en.json", "please ask reception.", "please ask at reception.")
        problems, _ = self.f.run()
        # EN có trên mọi tờ: 2 phần Markdown + 5 tờ HTML
        self.assertOnly(problems, "gw.notice_rights", "please ask [-at-] reception.", count=7)
        self.assertTrue(all(" · en · gw.notice_rights" in p for p in problems), problems)

    def test_built_html_not_rebuilt_fails(self):
        self.f.replace(self.f.html("a5"), "deleted within a further", "deleted within further")
        problems, _ = self.f.run()
        self.assertOnly(problems, "to-4-your-id-details-a5.html · Tờ 4 · en · gw.notice_retention",
                        "[-a-]", count=1)

    def test_second_copy_on_two_up_sheet_is_checked(self):
        html = self.f.html("a4-2-ban")
        text = html.read_text(encoding="utf-8")
        i = text.index("vui lòng hỏi lễ tân", text.index('data-sheet="4"', text.index('data-sheet="4"') + 1))
        html.write_text(text[:i] + "vui lòng gọi lễ tân" + text[i + len("vui lòng hỏi lễ tân"):], encoding="utf-8")
        problems, _ = self.f.run()
        self.assertOnly(problems, "a4-2-ban.html · Tờ 4 (bản 2/2) · vi · gw.notice_rights", count=1)

    def test_nbsp_dropped_in_russian_fails_and_is_shown(self):
        self.f.replace(self.f.md, "3%sмесяцев" % NBSP, "3 месяцев")
        problems, _ = self.f.run()
        self.assertOnly(problems, "Tờ 4ru · ru · gw.notice_retention", "[-3<U+00A0>месяцев-] {+3 месяцев+}",
                        count=1)

    def test_text_added_outside_a_paragraph_fails(self):
        # Câu thêm tay vào HTML, nằm giữa khối EN và VI (không trong <p> của khối nào).
        self.f.replace(self.f.html("a4"), '<hr class="rule">', '<hr class="rule">We also keep a copy.')
        problems, _ = self.f.run()
        self.assertOnly(problems, "CHỮ NGOÀI ĐOẠN  ", "to-4-your-id-details-a4.html · Tờ 4", "We also keep a copy.",
                        count=1)

    def test_invisible_character_added_fails(self):
        self.f.replace(self.f.html("a4-ru"), "Google Переводчиком", "Google​Переводчиком")
        problems, _ = self.f.run()
        self.assertOnly(problems, "a4-ru.html · Tờ 4ru · ru · gw.notice_translation", "<U+200B>", count=1)

    def test_markdown_emphasis_is_not_a_wording_change(self):
        # So chữ in ra giấy: **đậm** / *nghiêng* được dựng thành thẻ HTML, chữ vẫn là cùng chữ.
        self.f.replace(self.f.md, "To see, correct or delete", "To see, correct or **delete**")
        self.f.replace(self.f.md, "Saying no does not", "Saying no does *not*")
        self.assertEqual(self.f.run()[0], [])

    # ------------------------------------------------------------------ đoạn, version, ngôn ngữ

    def test_paragraph_dropped_fails_with_count(self):
        self.f.replace(self.f.md, "\nMuốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân.\n", "\n")
        problems, _ = self.f.run()
        self.assertOnly(problems, "LỆCH SỐ ĐOẠN  %s · Tờ 4 · vi: tờ có 4 đoạn, trang khách cần 5" % cpn.rel(self.f.md),
                        "gw.notice_body (2 đoạn)", count=1)

    def test_split_moved_to_mid_sentence_fails(self):
        # Đổi chỗ tách gw.notice_body: vẫn 2 đoạn, ghép lại vẫn đúng chữ, nhưng đoạn 1 dừng giữa câu.
        self.f.replace(self.f.md,
                       "ID photos are encrypted; only reception and managers can see them.\n\n"
                       "We will ask separately",
                       "ID photos are encrypted;\nonly reception and managers can see them. We will ask\n\n"
                       "separately")
        problems, _ = self.f.run()
        self.assertOnly(problems, "TÁCH GIỮA CÂU  %s · Tờ 4 · en · gw.notice_body" % cpn.rel(self.f.md), count=1)

    def test_footer_version_must_be_a_page_version(self):
        # Dòng chân tờ đứng riêng (chú thích <!-- … --> phía trên cũng nhắc chân tờ, trong ngoặc kép).
        self.f.replace(self.f.md, "\nOTTIMO · ID notice · v2 · 11/2026\n", "\nOTTIMO · ID notice · v3 · 11/2026\n")
        problems, _ = self.f.run()
        self.assertOnly(problems, "LỆCH VERSION  %s · Tờ 4: chân tờ ghi v3" % cpn.rel(self.f.md),
                        "privacy-2026-10-v2", count=1)

    def test_page_version_bumped_without_sheet_fails(self):
        self.f.replace(self.f.config, "['privacy-2026-10-v2']", "['privacy-2026-12-v3']")
        problems, _ = self.f.run()
        self.assertOnly(problems, "LỆCH VERSION", "privacy-2026-12-v3", count=7)

    def test_ru_page_back_on_english_fails_ru_sheet_only(self):
        self.f.replace(self.f.i18n, "new Set<string>([])", "new Set<string>(['gw.notice_body'])")
        problems, _ = self.f.run()
        self.assertOnly(problems, "LỆCH NGÔN NGỮ", "gw.notice_body", count=2)
        self.assertTrue(all("Tờ 4ru · ru" in p for p in problems), problems)

    def test_missing_legal_key_in_vietnamese_fails(self):
        self.f.replace(self.f.copy_dir / "strings-vi.json", '"guest.oci.consent_q"', '"guest.oci.consent_q_old"')
        problems, _ = self.f.run()
        self.assertOnly(problems, "LỆCH NGÔN NGỮ", "guest.oci.consent_q", count=5)
        self.assertTrue(all(" · vi: " in p for p in problems), problems)

    def test_page_paragraph_added_fails(self):
        self.f.replace(self.f.config, "  'gw.notice_rights',\n", "  'gw.notice_rights',\n  'gw.notice_read',\n")
        problems, _ = self.f.run()
        self.assertOnly(problems, "LỆCH SỐ ĐOẠN", "trang khách cần 6", count=14)

    # ------------------------------------------------------------------ tệp

    def test_missing_built_sheet_fails(self):
        self.f.html("a5").unlink()
        problems, _ = self.f.run()
        self.assertOnly(problems, "THIẾU  ", "to-4-your-id-details-a5", count=1)

    def test_unknown_built_sheet_fails(self):
        shutil.copy(self.f.html("a5"), self.f.print_dir / "to-4-your-id-details-v1.html")
        problems, _ = self.f.run()
        self.assertOnly(problems, "TỆP LẠ  ", "to-4-your-id-details-v1.html", count=1)

    def test_notice_jobs_removed_from_builder_exits_2(self):
        # SEC 165-01: bỏ các lần in Tờ 4 khỏi JOBS (tệp không thuộc SEC) và để thư mục HTML trống: vẫn đỏ.
        saved = list(bps.JOBS)
        try:
            bps.JOBS[:] = [j for j in saved if not any(k.startswith("4") for k in j["sheets"])]
            for p in self.f.print_dir.glob("*.html"):
                p.unlink()
            code, out = self.f.main()
        finally:
            bps.JOBS[:] = saved
        self.assertEqual(code, 2, out)
        self.assertIn("EXPECTED_NOTICE_JOBS", out)

    def test_notice_job_sheet_count_changed_exits_2(self):
        saved = [dict(j) for j in bps.JOBS]
        try:
            for j in bps.JOBS:
                if j["file"] == "to-4-your-id-details-a4-2-ban":
                    j["sheets"] = ["4"]
            code, out = self.f.main()
        finally:
            bps.JOBS[:] = saved
        self.assertEqual(code, 2, out)

    def test_unreadable_declaration_exits_2(self):
        self.f.replace(self.f.config, "export const NOTICE_PARAGRAPHS =", "export const NOTICE_KEYS =")
        code, out = self.f.main()
        self.assertEqual(code, 2, out)
        self.assertIn("NOTICE_PARAGRAPHS", out)

    # ------------------------------------------------------------------ bộ dựng tờ in

    def test_builder_stops_before_writing_on_mismatch(self):
        self.f.replace(self.f.md, "please ask reception.", "please ask the reception.")
        out = Path(self._tmp.name) / "out"
        with contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(SystemExit) as cm:
                bps.build(self.f.md, out, only=["to-4-your-id-details-a4"])
        self.assertIn("gw.notice_rights", str(cm.exception))
        self.assertFalse(out.exists())

    def test_builder_check_passes_on_repo_markdown(self):
        _, sheets = bps.read_source(cpn.DEFAULT_MD)
        self.assertEqual(cpn.check_markdown(cpn.DEFAULT_MD, sheets), [])


if __name__ == "__main__":
    unittest.main()
