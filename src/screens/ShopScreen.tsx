import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '../game/render/palette';
import { PURCHASABLE_SKINS, SKINS, SKIN_PACK_PRICE, SKIN_PACK_SKU } from '../game/skins';
import { purchase, restore } from '../services/iap';
import { track } from '../services/analytics';
import { useMetaStore, type SkinId } from '../state/metaStore';
import { NeonButton } from '../ui/NeonButton';

interface Props {
  onBack: () => void;
}

export function ShopScreen({ onBack }: Props) {
  const ownedSkins = useMetaStore((s) => s.ownedSkins);
  const equippedSkin = useMetaStore((s) => s.equippedSkin);
  const equipSkin = useMetaStore((s) => s.equipSkin);
  const [busy, setBusy] = useState<string | null>(null);

  const owned = (id: SkinId) => ownedSkins.includes(id);

  const buy = async (sku: string) => {
    setBusy(sku);
    await purchase(sku);
    setBusy(null);
  };

  const equip = (id: SkinId) => {
    equipSkin(id);
    track('skin_equipped', { skin: id });
  };

  const allOwned = (Object.keys(SKINS) as SkinId[]).every(owned);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>SHOP</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {PURCHASABLE_SKINS.map((skin) => (
          <View key={skin.id} style={[styles.card, { borderColor: skin.color }]}>
            <View style={[styles.swatch, { backgroundColor: skin.color, shadowColor: skin.color }]} />
            <View style={styles.info}>
              <Text style={styles.name}>{skin.name}</Text>
              <Text style={styles.price}>
                {owned(skin.id) ? 'Owned' : `$${skin.price.toFixed(2)}`}
              </Text>
            </View>
            {owned(skin.id) ? (
              <NeonButton
                label={equippedSkin === skin.id ? 'EQUIPPED' : 'EQUIP'}
                color={skin.color}
                disabled={equippedSkin === skin.id}
                onPress={() => equip(skin.id)}
                style={styles.cardBtn}
              />
            ) : (
              <NeonButton
                label={busy === skin.sku ? '…' : 'BUY'}
                color={skin.color}
                onPress={() => skin.sku && buy(skin.sku)}
                style={styles.cardBtn}
              />
            )}
          </View>
        ))}

        {!allOwned && (
          <View style={[styles.card, styles.packCard]}>
            <View style={styles.info}>
              <Text style={styles.name}>All Skins Pack</Text>
              <Text style={styles.price}>${SKIN_PACK_PRICE.toFixed(2)} · best value</Text>
            </View>
            <NeonButton
              label={busy === SKIN_PACK_SKU ? '…' : 'BUY ALL'}
              color={palette.coin}
              onPress={() => buy(SKIN_PACK_SKU)}
              style={styles.cardBtn}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <NeonButton label="RESTORE" color={palette.textDim} onPress={() => void restore()} />
        <NeonButton label="BACK" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgTop, paddingTop: 64, paddingHorizontal: 20 },
  title: { color: palette.text, fontSize: 36, fontWeight: '900', letterSpacing: 4, textAlign: 'center', marginBottom: 20 },
  list: { gap: 14, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  packCard: { borderColor: palette.coin, justifyContent: 'space-between' },
  swatch: { width: 48, height: 48, borderRadius: 12, shadowOpacity: 0.9, shadowRadius: 10 },
  info: { flex: 1 },
  name: { color: palette.text, fontSize: 18, fontWeight: '800' },
  price: { color: palette.textDim, fontSize: 14, marginTop: 2 },
  cardBtn: { minWidth: 120, paddingVertical: 12, paddingHorizontal: 16 },
  footer: { flexDirection: 'row', gap: 12, justifyContent: 'center', paddingVertical: 18 },
});
