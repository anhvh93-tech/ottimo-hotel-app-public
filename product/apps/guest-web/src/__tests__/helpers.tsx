import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { readLink, scrubLocation } from '../app/link';
import { MOCK_TOKENS } from '../mocks/handlers';

/** Boot exactly like main.tsx: read the link, scrub it, render. */
export function openLink(path: string = `/g/${MOCK_TOKENS.ok}`) {
  window.history.replaceState(null, '', path);
  const link = readLink(window.location.pathname);
  if (link.kind !== 'none') scrubLocation();
  const user = userEvent.setup({ applyAccept: false });
  const utils = render(<App link={link} />);
  return { user, ...utils };
}

export function jpeg(name = 'id.jpg', size = 2048) {
  return new File([new Uint8Array(size)], name, { type: 'image/jpeg' });
}
