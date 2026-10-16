import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button, ConfirmDialog, Field, Modal, Stepper } from './index';

describe('Field', () => {
  it('links label, help and error to the control', () => {
    render(
      <Field label="Tên" required help="Gợi ý" error="Bắt buộc">
        {(p) => <input {...p} className="input" />}
      </Field>,
    );
    const input = screen.getByLabelText(/Tên/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Bắt buộc.*Gợi ý/);
  });
});

describe('Button', () => {
  it('locks while busy (no double submit)', async () => {
    const onClick = vi.fn();
    render(
      <Button busy busyLabel="Đang lưu…" onClick={onClick}>
        Lưu
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Đang lưu…' });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Modal', () => {
  function Harness({ dirty }: { dirty: boolean }) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button">outside</button>
        <Modal
          open={open}
          title="Sửa căn"
          closeLabel="Đóng"
          onClose={() => setOpen(false)}
          dirty={dirty}
          unsavedLabels={{
            title: 'Bỏ thay đổi?',
            body: 'Mất dữ liệu',
            keep: 'Tiếp tục nhập',
            discard: 'Bỏ',
          }}
        >
          <input aria-label="name" />
        </Modal>
      </>
    );
  }

  it('moves focus inside and closes on Esc', async () => {
    render(<Harness dirty={false} />);
    const dialog = screen.getByRole('dialog', { name: 'Sửa căn' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText('name')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks before discarding unsaved input', async () => {
    render(<Harness dirty />);
    await userEvent.keyboard('{Escape}');
    const confirm = screen.getByRole('alertdialog', { name: 'Bỏ thay đổi?' });
    expect(screen.getByRole('button', { name: 'Tiếp tục nhập' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(confirm).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Sửa căn' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    await userEvent.click(screen.getByRole('button', { name: 'Bỏ' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ConfirmDialog', () => {
  it('focuses the safe button', () => {
    render(
      <ConfirmDialog
        title="Thu hồi?"
        body="Hậu quả"
        keepLabel="Không, quay lại"
        confirmLabel="Thu hồi"
        onKeep={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByRole('alertdialog', { name: 'Thu hồi?' })).toHaveAccessibleDescription(
      'Hậu quả',
    );
    expect(screen.getByRole('button', { name: 'Không, quay lại' })).toHaveFocus();
  });
});

describe('Stepper', () => {
  it('locks buttons at bounds', () => {
    render(
      <>
        <span id="l">Tối đa</span>
        <Stepper
          value={3}
          min={3}
          max={4}
          onChange={() => {}}
          labelledBy="l"
          decLabel="Giảm"
          incLabel="Tăng"
        />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Giảm' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tăng' })).toBeEnabled();
  });
});
