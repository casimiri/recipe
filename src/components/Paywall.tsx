// Paywall — the Recipe-Snap Pro upsell sheet. Reads the admin-configured price
// from AppState and runs the (mock) subscribe flow. Shown from Settings and
// whenever a free user hits the monthly AI limit.
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { useApp } from '../store/AppState';
import { formatPrice } from '../lib/repo';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Sheet, PrimaryButton } from './atoms';

export function Paywall({ open, onClose, reachedLimit }: { open: boolean; onClose: () => void; reachedLimit?: boolean }) {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { pro, proRenewsAt, priceCents, currency, freeAiQuota, subscribe } = useApp();
  const [busy, setBusy] = useState(false);
  const price = formatPrice(priceCents, currency);

  const go = async () => {
    setBusy(true);
    const ok = await subscribe();
    setBusy(false);
    if (ok) onClose();
  };

  const benefits = [
    tr((s) => s.pro.benefitImports),
    tr((s) => s.pro.benefitTools),
    tr((s) => s.pro.benefitCancel),
  ];

  return (
    <Sheet open={open} onClose={onClose} t={t} title={tr((s) => s.pro.title)}>
      {reachedLimit && !pro ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: t.accentSofter, paddingVertical: 11, paddingHorizontal: 14, borderRadius: t.radiusSm, marginBottom: 16 }}>
          <Icon.sparkle size={17} color={t.accent} />
          <Txt style={{ color: t.accent, fontSize: 13, fontWeight: '700', flex: 1 }}>
            {tr((s) => s.pro.limitBody, { count: freeAiQuota })}
          </Txt>
        </View>
      ) : (
        <Txt style={{ fontSize: 14.5, color: t.muted, lineHeight: 22, marginBottom: 18 }}>{tr((s) => s.pro.tagline)}</Txt>
      )}

      <View style={{ gap: 12, marginBottom: 22 }}>
        {benefits.map((b) => (
          <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.check size={15} sw={3} color={t.accent} />
            </View>
            <Txt style={{ fontSize: 15, color: t.text, flex: 1 }}>{b}</Txt>
          </View>
        ))}
      </View>

      {pro ? (
        <View style={{ alignItems: 'center', gap: 4, paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon.sparkle size={18} color={t.accent} />
            <Txt style={{ fontSize: 15.5, fontWeight: '800', color: t.accent }}>{tr((s) => s.pro.active)}</Txt>
          </View>
          {proRenewsAt ? (
            <Txt style={{ fontSize: 13, color: t.muted }}>{tr((s) => s.pro.until, { date: new Date(proRenewsAt).toLocaleDateString() })}</Txt>
          ) : null}
        </View>
      ) : (
        <PrimaryButton t={t} full disabled={busy} onPress={go} style={{ paddingVertical: 16 }}>
          {busy ? tr((s) => s.pro.processing) : tr((s) => s.pro.cta, { price })}
        </PrimaryButton>
      )}
    </Sheet>
  );
}
