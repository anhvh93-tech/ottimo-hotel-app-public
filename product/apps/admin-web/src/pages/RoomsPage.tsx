import type { Room, RoomGroup } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip } from '@ottimo/ui';
import { useState } from 'react';
import { api } from '../app/api';
import { Page, Topbar } from '../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { useResource } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';
import { RoomDrawer } from './RoomDrawer';

/** A101/A103: only owner and manager edit the unit list; other roles get the catalog view (rbac 25a). */
export function canEditRooms(roles: string[]) {
  return roles.includes('owner') || roles.includes('manager');
}

/** H04 4.1 – unit list with standard / maximum occupancy per unit (ESC-014). */
export function RoomsPage() {
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const editable = canEditRooms(roles);
  const [editing, setEditing] = useState<Room | null>(null);
  const { state, reload, mutate } = useResource(async () => {
    const [rooms, groups] = await Promise.all([
      api.listRooms({ propertyId }),
      api.listRoomGroups({ propertyId }),
    ]);
    return { rooms: rooms.data.data, groups: groups.data.data };
  }, [propertyId]);

  const groups = state.data?.groups ?? [];
  const groupName = (id: string) => groups.find((g: RoomGroup) => g.id === id)?.name ?? '–';
  const rooms = [...(state.data?.rooms ?? [])].sort((a, b) => a.roomNo.localeCompare(b.roomNo));

  return (
    <>
      <Topbar
        title={t('config.rooms')}
        sub={
          state.data
            ? t('rooms.subtitle', { rooms: rooms.length, groups: groups.length })
            : undefined
        }
      />
      <Page>
        <Alert tone="info" icon="sofa" role="note">
          {t('rooms.rule_note')}
        </Alert>
        {!editable ? (
          <Alert tone="info" role="note">
            {t('rooms.view_only')}
          </Alert>
        ) : null}
        {state.status === 'error' && !state.data ? (
          <ErrorBlock titleKey="rooms.error_title" error={state.error} onRetry={reload} />
        ) : state.status === 'loading' && !state.data ? (
          <LoadingBlock />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">{t('config.rooms')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('rooms.col_room')}</th>
                  <th scope="col">{t('rooms.col_group')}</th>
                  <th scope="col" className="c">
                    {t('rooms.col_base')}
                  </th>
                  <th scope="col" className="c">
                    {t('rooms.col_max')}
                  </th>
                  <th scope="col" className="r">
                    {t('rooms.col_month')}
                  </th>
                  <th scope="col" className="r">
                    {t('rooms.col_night')}
                  </th>
                  <th scope="col">{t('rooms.col_sale')}</th>
                  {editable ? (
                    <th scope="col">
                      <span className="sr-only">{t('rooms.col_action')}</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} aria-selected={editing?.id === r.id || undefined}>
                    <td>
                      <b>{r.roomNo}</b> {r.name}
                    </td>
                    <td>{groupName(r.roomGroupId)}</td>
                    <td className="c num">{r.baseOccupancy ?? '–'}</td>
                    <td className="c num">{r.maxOccupancy ?? '–'}</td>
                    <td className="r num">
                      {r.currentListPrice?.monthlyListPriceVnd !== undefined
                        ? vnd(r.currentListPrice.monthlyListPriceVnd)
                        : '–'}
                    </td>
                    <td className="r num">
                      {r.currentListPrice?.nightlyListPriceVnd !== undefined
                        ? vnd(r.currentListPrice.nightlyListPriceVnd)
                        : '–'}
                    </td>
                    <td>
                      {r.isSellable ? (
                        <Chip tone="ok" icon="check">
                          {t('rooms.selling')}
                        </Chip>
                      ) : (
                        <Chip tone="neutral" icon="lock">
                          {t('config.stop_sale')}
                        </Chip>
                      )}
                    </td>
                    {editable ? (
                      <td>
                        <Button
                          size="sm"
                          onClick={() => setEditing(r)}
                          aria-label={`${t('rooms.edit')} ${r.roomNo}`}
                        >
                          {t('rooms.edit')}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ fontSize: '.75rem', marginTop: 10 }}>
          {t('rooms.footnote')}
        </p>
      </Page>
      {editing ? (
        <RoomDrawer
          room={editing}
          groups={groups}
          onClose={() => setEditing(null)}
          onSaved={(room) => {
            mutate((d) => ({ ...d, rooms: d.rooms.map((x) => (x.id === room.id ? room : x)) }));
            setEditing(null);
          }}
          onReload={reload}
        />
      ) : null}
    </>
  );
}
