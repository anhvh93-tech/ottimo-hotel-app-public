import type { Item, ItemInput } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, StateView, Switch } from '@ottimo/ui';
import { useState } from 'react';
import { api } from '../app/api';
import { useLiveReload } from '../app/live';
import { Code } from '../app/mono';
import { useToast } from '../app/toast';
import { Page, Topbar } from '../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { useOnline } from '../hooks/useOnline';
import { useResource } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';
import { MoneyField, amountOf, useSubmit, useUnsavedLabels } from './stay/common';

const OWN_MGR = ['owner', 'manager'];

/**
 * S13 Danh mục minibar (US-066, BR-701, A91): OWN/MGR add and edit items (sale price or "miễn phí", cost
 * price, standard per minibar, minimum stock); the new price applies to later checks and posted folio lines
 * keep theirs (AC2). FD/FDL/HK only read (AC3); the cost price is never sent to them (US-003 AC2).
 */
export function MinibarPage() {
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const { online } = useOnline();
  const manager = roles.some((r) => OWN_MGR.includes(r));
  const { state, reload } = useResource(
    async () => (await api.listItems({ propertyId })).data.data,
    [propertyId],
  );
  useLiveReload(propertyId, reload);
  const [editing, setEditing] = useState<Item | 'new' | null>(null);
  const items = state.data;
  const showCost = manager && (items ?? []).some((i) => i.costPriceVnd !== undefined);

  return (
    <>
      <Topbar
        title={t('config.minibar')}
        actions={
          manager && online ? (
            <Button variant="pri" icon="plus" onClick={() => setEditing('new')}>
              {t('mb.add')}
            </Button>
          ) : undefined
        }
      />
      <Page>
        {!manager ? (
          <Alert tone="info" role="note">
            {t('mb.readonly')}
          </Alert>
        ) : null}
        {!items && state.status === 'error' ? (
          <ErrorBlock titleKey="mb.error_title" error={state.error} onRetry={reload} />
        ) : !items ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <StateView icon="tag" title={t('mb.empty_title')}>
            {t('mb.empty_body')}
          </StateView>
        ) : (
          <div className="table-wrap mt-12">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('mb.col.code')}</th>
                  <th scope="col">{t('mb.col.name')}</th>
                  <th scope="col">{t('mb.col.unit')}</th>
                  <th scope="col" className="r">
                    {t('mb.col.std')}
                  </th>
                  <th scope="col" className="r">
                    {t('mb.col.sale')}
                  </th>
                  {showCost ? (
                    <th scope="col" className="r">
                      {t('mb.col.cost')}
                    </th>
                  ) : null}
                  <th scope="col" className="r">
                    {t('mb.col.min')}
                  </th>
                  <th scope="col">{t('mb.col.status')}</th>
                  {manager ? (
                    <th scope="col">
                      <span className="sr-only">{t('rooms.edit')}</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Code>{i.code}</Code>
                    </td>
                    <td>{i.name}</td>
                    <td>{i.unit}</td>
                    <td className="r num">{i.minibarStandardQty}</td>
                    <td className="r num">
                      {i.isFree || i.salePriceVnd === null || i.salePriceVnd === undefined
                        ? t('checkout.minibar.free')
                        : vnd(i.salePriceVnd)}
                    </td>
                    {showCost ? (
                      <td className="r num">
                        {i.costPriceVnd !== undefined ? vnd(i.costPriceVnd) : '—'}
                      </td>
                    ) : null}
                    <td className="r num">{i.minStockQty ?? '—'}</td>
                    <td>
                      {i.isActive === false ? (
                        <Chip icon="x">{t('mb.inactive')}</Chip>
                      ) : (
                        <Chip tone="ok">{t('mb.active')}</Chip>
                      )}
                    </td>
                    {manager ? (
                      <td>
                        <Button size="sm" disabled={!online} onClick={() => setEditing(i)}>
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
      </Page>
      {editing ? (
        <ItemDialog
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </>
  );
}

function ItemDialog({
  item,
  onClose,
  onDone,
}: {
  item: Item | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const unsaved = useUnsavedLabels();
  const [code, setCode] = useState(item?.code ?? '');
  const [nameVi, setNameVi] = useState(item?.name ?? '');
  const [nameEn, setNameEn] = useState('');
  const [unit, setUnit] = useState(item?.unit ?? '');
  const [free, setFree] = useState(item ? item.isFree : false);
  const [sale, setSale] = useState(item?.salePriceVnd ? vnd(item.salePriceVnd) : '');
  const [cost, setCost] = useState(item?.costPriceVnd !== undefined ? vnd(item.costPriceVnd) : '');
  const [std, setStd] = useState(String(item?.minibarStandardQty ?? 1));
  const [minStock, setMinStock] = useState(String(item?.minStockQty ?? 0));
  const [active, setActive] = useState(item?.isActive !== false);
  const [dirty, setDirty] = useState(false);
  const act = useSubmit({
    bound: [
      'code',
      'name.vi',
      'unit',
      'salePriceVnd',
      'costPriceVnd',
      'minibarStandardQty',
      'minStockQty',
    ],
  });
  const touch =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      setDirty(true);
      set(v);
    };
  const save = async () => {
    const body: ItemInput = {
      code: code.trim(),
      name: { vi: nameVi.trim(), en: nameEn.trim() || undefined },
      unit: unit.trim(),
      salePriceVnd: free ? null : amountOf(sale),
      costPriceVnd: cost ? amountOf(cost) : undefined,
      minibarStandardQty: Number(std),
      minStockQty: Number(minStock),
      isActive: active,
    };
    const out = await act.submit((idem) =>
      item
        ? api.updateItem({ propertyId, itemId: item.id }, body, item.version)
        : api.createItem({ propertyId }, body, idem),
    );
    if (out) {
      toast(t('mb.saved', { name: out.data.name }));
      onDone();
    }
  };
  return (
    <Modal
      open
      title={item ? t('mb.edit_title', { name: item.name }) : t('mb.add_title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={dirty}
      unsavedLabels={unsaved}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            onClick={() => void save()}
          >
            {act.label(t('common.save'))}
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="g-2">
          <Field label={t('mb.col.code')} help={t('mb.code_help')} required error={act.fields.code}>
            {(p) => (
              <input
                {...p}
                className="input mono"
                maxLength={40}
                value={code}
                onChange={(e) => touch(setCode)(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('mb.col.unit')} required error={act.fields.unit}>
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={20}
                value={unit}
                onChange={(e) => touch(setUnit)(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('mb.name_vi')} required error={act.fields['name.vi']}>
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={80}
                value={nameVi}
                onChange={(e) => touch(setNameVi)(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('mb.name_en')}>
            {(p) => (
              <input
                {...p}
                lang="en"
                className="input"
                maxLength={80}
                value={nameEn}
                onChange={(e) => touch(setNameEn)(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Switch checked={free} onChange={touch(setFree)}>
          {t('mb.free_toggle')}
        </Switch>
        <div className="g-2">
          {free ? null : (
            <MoneyField
              label={t('mb.col.sale')}
              required
              value={sale}
              onChange={touch(setSale)}
              error={act.fields.salePriceVnd}
            />
          )}
          <MoneyField
            label={t('mb.col.cost')}
            value={cost}
            onChange={touch(setCost)}
            error={act.fields.costPriceVnd}
          />
          <Field label={t('mb.col.std')} required error={act.fields.minibarStandardQty}>
            {(p) => (
              <input
                {...p}
                type="number"
                min={0}
                className="input num"
                value={std}
                onChange={(e) => touch(setStd)(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('mb.col.min')} error={act.fields.minStockQty}>
            {(p) => (
              <input
                {...p}
                type="number"
                min={0}
                className="input num"
                value={minStock}
                onChange={(e) => touch(setMinStock)(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Switch checked={active} onChange={touch(setActive)}>
          {t('mb.active')}
        </Switch>
        {item ? <p className="caption">{t('mb.price_note')}</p> : null}
        {act.view()}
      </div>
    </Modal>
  );
}
