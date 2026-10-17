import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { renderApp, tv } from '../test/render';

const res = (guest: string) => mockControl.rsv.reservations.find((r) => r.guestName === guest)!;

describe('A22a – online check-in link from the reservation drawer (H11/H15)', () => {
  it('FD issues a link shown once (copy + QR), never stored; the clipboard copy is wiped; revoke', async () => {
    const r = res('Gia đình anh Hưng');
    expect(r.status).toBe('confirmed');
    const { user } = renderApp(`/reservations/${r.id}`, 'qa.fd');
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    const logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map((k) =>
      vi.spyOn(console, k),
    );
    const drawer = await screen.findByRole('dialog', { name: 'Gia đình anh Hưng' });

    // First link: issued at once (nothing to replace yet in this session).
    await user.click(within(drawer).getByRole('button', { name: tv('rsv.guest_link.create') }));
    const box = await screen.findByRole('dialog', {
      name: tv('rsv.guest_link.title', { code: r.code }),
    });
    const url = within(box).getByTestId('guest-link').textContent!;
    expect(url).toMatch(/^https:\/\/guest\.ottimo\.local\/g\/\w+/);
    expect(within(box).getByText(tv('rsv.guest_link.once_warning'))).toBeInTheDocument();
    expect(within(box).getByText(tv('rsv.guest_link.send_note'))).toBeInTheDocument();
    expect(within(box).getByText(tv('rsv.guest_link.send_private'))).toBeInTheDocument();
    expect(
      within(box).getByRole('img', { name: tv('rsv.guest_link.title', { code: r.code }) }),
    ).toBeInTheDocument();
    await user.click(within(box).getByRole('button', { name: tv('rsv.guest_link.copy') }));
    expect(write).toHaveBeenLastCalledWith(url);
    expect(within(box).getByText(tv('rsv.guest_link.copied'))).toBeInTheDocument();
    // SEC: the token is in memory only – not in web storage, not in the address.
    const stored = [
      ...Object.values({ ...localStorage }),
      ...Object.values({ ...sessionStorage }),
    ].join(' ');
    expect(stored).not.toContain(url.split('/g/')[1]!);
    expect(window.location.href).not.toContain(url.split('/g/')[1]!);
    // s3-SEC §8 (3): never in the console either.
    for (const spy of logs)
      expect(JSON.stringify(spy.mock.calls)).not.toContain(url.split('/g/')[1]!);

    // Closing drops the link (shown once).
    await user.click(within(box).getAllByRole('button', { name: tv('common.close') })[0]!);
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: tv('rsv.guest_link.title', { code: r.code }) }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(url)).not.toBeInTheDocument();

    // A second link replaces the first – asked first (DS 6.1).
    await user.click(within(drawer).getByRole('button', { name: tv('rsv.guest_link.reissue') }));
    const again = await screen.findByRole('alertdialog', {
      name: tv('gw.link_reissue_title', { code: r.code }),
    });
    await user.click(within(again).getByRole('button', { name: tv('rsv.guest_link.reissue') }));
    const box2 = await screen.findByRole('dialog', {
      name: tv('rsv.guest_link.title', { code: r.code }),
    });
    expect(within(box2).getByTestId('guest-link').textContent).not.toBe(url);
    expect(mockControl.stay.guestLinks.get(r.id)?.count).toBe(2);
    await user.click(within(box2).getAllByRole('button', { name: tv('common.close') })[0]!);

    await user.click(within(drawer).getByRole('button', { name: tv('rsv.guest_link.revoke') }));
    const rv = await screen.findByRole('alertdialog', {
      name: tv('gw.link_revoke_title', { code: r.code }),
    });
    await user.click(within(rv).getByRole('button', { name: tv('rsv.guest_link.revoke') }));
    expect(
      await screen.findByText(tv('rsv.guest_link.revoked_toast', { code: r.code })),
    ).toBeInTheDocument();
    expect(mockControl.stay.guestLinks.get(r.id)?.revokedAt).toBeTruthy();
    // Revoking also overwrites the copied link in the clipboard.
    expect(write).toHaveBeenLastCalledWith('');
    // Toasts never carry the link.
    expect(document.body.textContent).not.toContain(url.split('/g/')[1]!);
    write.mockRestore();
    for (const spy of logs) spy.mockRestore();
  });

  it('not offered once the guest is in house', async () => {
    renderApp(`/reservations/${res('Phạm Huy').id}`, 'qa.fd');
    await screen.findByRole('dialog', { name: 'Phạm Huy' });
    expect(
      screen.queryByRole('button', { name: tv('rsv.guest_link.create') }),
    ).not.toBeInTheDocument();
  });
});
