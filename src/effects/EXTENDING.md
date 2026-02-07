# Hướng dẫn mở rộng Effect System

## Tổng quan cấu trúc

```
src/effects/
├── index.ts          # Main entry point
├── types.ts          # Type definitions
├── registry.ts       # Effect registry & helpers
├── parser.ts         # Text to Effect parser
├── resolver.ts       # Apply effects to character
├── data/
│   ├── index.ts      # Data initialization
│   ├── races.ts      # Race & Sub-race effects
│   ├── runes.ts      # Rune & Runeword effects
│   └── ...           # Thêm files mới ở đây
└── handlers/         # Custom handlers (TODO)
    └── index.ts
```

## Thêm Effect Category mới

### Bước 1: Tạo file data

Tạo file mới trong `src/effects/data/`, ví dụ `powers.ts`:

```typescript
import { defineEffect } from '../registry';

export function registerAllPowerEffects() {
  // Critical Strike
  defineEffect('power', 'Critical Strike')
    .description('Trong Combat: Với mỗi round thắng, có 20% nhận thêm 1 điểm.')
    .effect({
      type: 'extra_point_on_win',
      points: 1,
      timing: 'on_round_win',
      target: 'self',
      conditions: [{ type: 'probability', chance: 20 }]
    })
    .register();

  // Evasion
  defineEffect('power', 'Evasion')
    .description('Trong Combat: Với mỗi round thua, có 20% không mất điểm.')
    .effect({
      type: 'immunity',
      immuneTo: ['point_loss'],
      timing: 'on_round_lose',
      target: 'self',
      conditions: [{ type: 'probability', chance: 20 }]
    })
    .register();

  // Fire Control
  defineEffect('power', 'Fire Control')
    .description('+1 MA và +1 vào stat thấp nhất.')
    .addStat('ma', 1)
    .addStat('lowest', 1)
    .register();

  // ... thêm powers khác
}
```

### Bước 2: Register trong data/index.ts

```typescript
import { registerAllPowerEffects } from './powers';

export function initializeEffectData(): void {
  if (isInitialized) return;

  registerAllRuneEffects();
  registerAllRaceEffects();
  registerAllPowerEffects();  // Thêm dòng này

  isInitialized = true;
}
```

## API Reference

### defineEffect(sourceType, name)

Builder pattern để tạo effect entry.

```typescript
defineEffect('power', 'My Power')
  .description('Mô tả effect')        // Bắt buộc
  .weight(10)                         // Trọng số trong wheel
  .tier(5)                            // Tier/rank
  .unique()                           // Chỉ 1 người có

  // Quick helpers
  .addStat('strength', 2)             // +2 Strength
  .addStat('all', 1)                  // +1 all stats
  .addStat('lowest', 2)               // +2 stat thấp nhất
  .addStat('speed', 3, true)          // +3 Base Speed

  .addAllStats(1)                     // +1 all stats
  .addAllStats(-1)                    // -1 all stats

  .grantPower()                       // Nhận 1 random Power
  .grantPower('Critical Strike')      // Nhận Power cụ thể
  .grantPower('random', 2)            // Nhận 2 random Powers

  .grantQuirk()                       // Nhận 1 random Quirk
  .grantQuirk('random', 3)            // Nhận 3 random Quirks

  .debuffOpponent('speed', 2)         // Debuff đối thủ -2 Speed
  .startingPoints(1)                  // +1 điểm combat khởi đầu
  .immuneTo('AIDS', 'debuff')         // Miễn nhiễm

  // Manual effect
  .effect({
    type: 'stat_modifier',
    stat: 'iq',
    value: 2,
    timing: 'during_combat',
    target: 'self',
    conditions: [{ type: 'bracket', bracket: 'loser' }]
  })

  .register();                        // Đăng ký vào registry
```

### Effect Types

| Type | Mô tả |
|------|-------|
| `stat_modifier` | +/- stat |
| `stat_set` | Set stat = value |
| `stat_swap` | Đổi 2 stats |
| `stat_inversion` | Đảo ngược với opponent |
| `stat_respin` | Re-spin stat |
| `grant_power` | Nhận Power |
| `grant_quirk` | Nhận Quirk |
| `grant_gear` | Nhận Gear |
| `grant_archetype` | Nhận Archetype |
| `grant_lover` | Nhận Lover |
| `steal_power` | Cướp Power |
| `combat_points` | Điểm combat |
| `extra_point_on_win` | +điểm khi thắng round |
| `lose_points_on_lose` | Mất điểm khi thua |
| `auto_win_round` | Tự động thắng round |
| `buff` | Buff bản thân |
| `debuff` | Debuff opponent |
| `immunity` | Miễn nhiễm |
| `weapon_disable` | Vô hiệu vũ khí |
| `power_disable` | Vô hiệu Power |
| `evolve` | Tiến hóa |
| `house_assign` | Gán House |
| `wheel_grant` | Cho thêm vòng quay |
| `make_love` | Biến thành Lover |
| `isekai` | Loại khỏi game |
| `custom` | Custom handler |

### Effect Timing

| Timing | Khi nào |
|--------|---------|
| `immediate` | Ngay khi nhận (passive) |
| `before_combat` | Trước Combat |
| `during_combat` | Trong Combat |
| `after_combat` | Sau Combat |
| `after_combat_win` | Sau Combat thắng |
| `after_combat_lose` | Sau Combat thua |
| `on_round_win` | Khi thắng round |
| `on_round_lose` | Khi thua round |
| `on_loser_bracket` | Ở nhánh thua |
| `on_winner_bracket` | Ở nhánh thắng |
| `on_finals` | Ở chung kết |
| `on_pvp_win` | Khi thắng PvP |
| `pve_only` | Chỉ PvE |
| `pvp_only` | Chỉ PvP |

### Conditions

```typescript
// Probability
{ type: 'probability', chance: 20 }

// Stat compare
{
  type: 'stat_compare',
  stat: 'iq',
  compareWith: 'opponent',
  operator: '>'
}

// Compare with value
{
  type: 'stat_compare',
  stat: 'strength',
  compareWith: 'value',
  compareValue: 5,
  operator: '>='
}

// Compare own stats
{
  type: 'stat_compare',
  stat: 'iq',
  compareWith: 'own_stat',
  compareStat: 'strength',
  operator: '>'
}

// Race match
{ type: 'race_match', races: ['Human', 'Dwarf'] }

// Race tier compare
{ type: 'race_tier_compare', tierOperator: '>' }

// Bracket
{ type: 'bracket', bracket: 'loser' }

// PvP win count
{ type: 'pvp_win_count', winCount: 2, winCountOperator: '>=' }

// Has item
{ type: 'has_item', itemType: 'lover' }
{ type: 'has_item', itemType: 'power', itemName: 'Critical Strike' }

// Opponent has
{ type: 'opponent_has', opponentItemType: 'lover' }
```

## Custom Handlers

Khi effect quá phức tạp để định nghĩa bằng data, dùng custom handler:

```typescript
defineEffect('runeword', 'Kinetics')
  .description('Strength += Base Speed / 2')
  .effect({
    type: 'stat_modifier',
    stat: 'strength',
    value: 0, // Calculated by handler
    timing: 'before_combat',
    target: 'self',
    customHandler: 'kinetics_speed_to_str'
  })
  .register();
```

Implement handler:

```typescript
// src/effects/handlers/runeword-handlers.ts

export const runewordHandlers = {
  kinetics_speed_to_str: (effect, context) => {
    const bonusStr = Math.floor(context.self.stats.speed / 2);
    return {
      ...effect,
      value: bonusStr
    };
  }
};
```

## Sử dụng trong Component

```typescript
import { useEffect, useState } from 'react';
import {
  initializeEffectData,
  EffectResolver,
  type CharacterEffects
} from '../effects';
import type { Character } from '../types/character';

function CharacterStats({ character }: { character: Character }) {
  const [effects, setEffects] = useState<CharacterEffects | null>(null);

  useEffect(() => {
    // Initialize once
    initializeEffectData();

    // Calculate effects
    const calculated = EffectResolver.calculateCharacterEffects(character);
    setEffects(calculated);
  }, [character]);

  if (!effects) return <div>Loading...</div>;

  return (
    <div>
      <h3>Total Stats</h3>
      <ul>
        <li>STR: {effects.totalStats.strength}</li>
        <li>SPD: {effects.totalStats.speed}</li>
        <li>DUR: {effects.totalStats.durability}</li>
        <li>IQ: {effects.totalStats.iq}</li>
        <li>BIQ: {effects.totalStats.biq}</li>
        <li>MA: {effects.totalStats.ma}</li>
      </ul>

      <h3>Stat Modifiers</h3>
      <ul>
        {effects.statModifiers.map((mod, i) => (
          <li key={i}>
            {mod.source}: {mod.value > 0 ? '+' : ''}{mod.value} {mod.stat}
            {mod.isBase && ' (Base)'}
          </li>
        ))}
      </ul>

      <h3>Immunities</h3>
      <ul>
        {effects.immunities.map((imm, i) => (
          <li key={i}>{imm}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Checklist khi thêm Effect mới

- [ ] Xác định source type (race, power, quirk, etc.)
- [ ] Xác định timing (immediate, combat, etc.)
- [ ] Xác định target (self, opponent, team)
- [ ] Xác định conditions nếu có
- [ ] Implement bằng `defineEffect()` hoặc custom handler
- [ ] Test với character có effect đó
- [ ] Update documentation nếu cần
