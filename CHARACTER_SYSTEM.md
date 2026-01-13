# Character System Documentation

Hệ thống quản lý nhân vật RPG cho Wheel of Multiverse.

## 📁 Cấu trúc File

```
src/
├── types/
│   └── character.ts          # TypeScript interfaces cho nhân vật
├── utils/
│   └── characterParser.ts    # Parser để đọc file .txt
├── managers/
│   └── CharacterManager.ts   # Class quản lý nhân vật
├── components/
│   ├── CharacterCard.tsx     # Component hiển thị chi tiết nhân vật
│   └── CharacterList.tsx     # Component danh sách nhân vật
└── hooks/
    └── useCharacters.ts      # React hooks để sử dụng trong components

public/
└── data/
    ├── No35.txt
    ├── No41.txt
    ├── No42.txt
    ├── ...
    └── No50.txt              # Các file dữ liệu nhân vật
```

## 🎯 Tính năng

### 1. Character Types
- **Character**: Interface đầy đủ cho nhân vật
- **CharacterStats**: Stats (Str, Spd, Dur, IQ, BIQ, MA)
- **CharacterRace**: Race và Sub-race
- **Gear**: Normal gear và Legacy gear
- **Weapon**: Normal, Unique, Legacy weapons
- **Rune**: Runes và Runewords
- **PvPReward**: Phần thưởng PvP

### 2. Character Manager
Singleton class quản lý tất cả nhân vật với các chức năng:

```typescript
import { characterManager } from './managers/CharacterManager';

// Load tất cả nhân vật
await characterManager.loadCharacters();

// Lấy nhân vật theo số
const character = characterManager.getCharacter(43);

// Lấy nhân vật theo username
const character = characterManager.getCharacterByUsername('swem');

// Lấy tất cả nhân vật
const all = characterManager.getAllCharacters();

// Filter nhân vật
const elves = characterManager.filterCharacters({ race: 'Elf' });
const team2 = characterManager.getCharactersByTeam(2);
const lannister = characterManager.getCharactersByHouse('Lannister');

// Tìm kiếm
const results = characterManager.searchCharacters('swem');

// Random nhân vật
const random = characterManager.getRandomCharacter();
const random10 = characterManager.getRandomCharacters(10);

// Stats
const stats = characterManager.getStatsSummary();
const strongest = characterManager.getStrongestCharacters(5);
```

### 3. React Hooks

#### useCharacters
Hook cơ bản để load nhân vật:
```typescript
import { useCharacters } from './hooks/useCharacters';

function MyComponent() {
  const { loading, error, isLoaded, characterCount } = useCharacters();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Loaded {characterCount} characters</div>;
}
```

#### useCharactersList
Lấy danh sách tất cả nhân vật:
```typescript
const { characters, loading, error, refresh } = useCharactersList();
```

#### useCharacter
Lấy một nhân vật cụ thể:
```typescript
const { character, loading, error } = useCharacter(43);
```

#### useCharacterSearch
Tìm kiếm nhân vật:
```typescript
const [query, setQuery] = useState('');
const { results, loading, error } = useCharacterSearch(query);
```

#### useCharacterFilter
Filter nhân vật với nhiều điều kiện:
```typescript
const { results } = useCharacterFilter({
  race: 'Elf',
  house: 'Lannister',
  team: 2,
  hasLover: true
});
```

#### useRandomCharacter & useRandomCharacters
Random nhân vật:
```typescript
const { getRandomCharacter } = useRandomCharacter();
const { getRandomCharacters } = useRandomCharacters(10);

const randomChar = getRandomCharacter();
const random10 = getRandomCharacters();
```

#### useCharacterWheel
**Đặc biệt cho Wheel of Fortune:**
```typescript
import { useCharacterWheel } from './hooks/useCharacters';

function WheelPage() {
  const { wheelCharacters, loadWheelCharacters, getWheelItems, isLoaded } = useCharacterWheel();

  useEffect(() => {
    if (isLoaded) {
      // Load tất cả nhân vật vào wheel
      loadWheelCharacters();

      // Hoặc chỉ load 20 nhân vật random
      // loadWheelCharacters(20);
    }
  }, [isLoaded]);

  const wheelItems = getWheelItems();

  // wheelItems format:
  // [
  //   { id: 43, label: "Swem (.swem)", character: {...} },
  //   { id: 41, label: "Nicre (.jan_01)", character: {...} },
  //   ...
  // ]

  return <WheelComponent items={wheelItems} />;
}
```

#### useCharacterStats
Thống kê tổng quan:
```typescript
const { stats, loading, error } = useCharacterStats();

// stats = {
//   totalCharacters: 11,
//   races: ['Elf', 'Merfolk', 'Goblin', 'Giant'],
//   archetypes: ['Femboy', 'Summoner', 'Dual Wielder', 'Egoist'],
//   houses: ['House Lannister', 'Naga'],
//   teams: [2, 6, 16, 19],
//   withLovers: 2,
//   withParasite: 8
// }
```

### 4. Components

#### CharacterCard
Component hiển thị chi tiết nhân vật:
```typescript
import { CharacterCard } from './components/CharacterCard';

<CharacterCard
  character={character}
  onClose={() => setSelectedCharacter(null)}
/>
```

#### CharacterList
Component danh sách nhân vật với tìm kiếm và filter:
```typescript
import { CharacterList } from './components/CharacterList';

<CharacterList />
```

## 🔧 Tích hợp vào Wheel

### Cách 1: Sử dụng useCharacterWheel hook
```typescript
import { useCharacterWheel } from './hooks/useCharacters';
import { useState } from 'react';

function WheelOfFortune() {
  const { loadWheelCharacters, getWheelItems, isLoaded } = useCharacterWheel();
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  useEffect(() => {
    if (isLoaded) {
      loadWheelCharacters(); // Load all characters
    }
  }, [isLoaded]);

  const handleWheelStop = (result) => {
    // result.character chứa thông tin nhân vật đầy đủ
    setSelectedCharacter(result.character);
  };

  return (
    <div>
      <Wheel
        items={getWheelItems()}
        onStop={handleWheelStop}
      />

      {selectedCharacter && (
        <CharacterCard
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
}
```

### Cách 2: Sử dụng CharacterManager trực tiếp
```typescript
import { characterManager } from './managers/CharacterManager';

async function setupWheel() {
  await characterManager.loadCharacters();

  // Lấy 10 nhân vật random
  const randomChars = characterManager.getRandomCharacters(10);

  // Tạo wheel items
  const wheelItems = randomChars.map(char => ({
    id: char.no,
    label: characterManager.getDisplayName(char),
    data: char
  }));

  return wheelItems;
}
```

## 📝 Format Dữ liệu File .txt

File nhân vật phải theo format:
```
No.43
Name: Swem (.swem)

```
Ký Sinh:
+
```

```
Race: Elf
Sub-race: Moon Elf
```

```
Archetype:
+ Femboy
```

```
2 Quirk:
+ Artistic
+ Raumanian
```

```
Str: 9
Spd: 6
Dur: 2
IQ: 6
BIQ: 3
MA: 8
```

... (xem các file hiện có để tham khảo)
```

## 🚀 Sử dụng nhanh

1. **Đặt file dữ liệu vào** `public/data/NoXX.txt`

2. **Import và sử dụng trong component:**
```typescript
import { useCharacterWheel } from './hooks/useCharacters';
import { CharacterCard } from './components/CharacterCard';

function App() {
  const { loadWheelCharacters, getWheelItems, isLoaded } = useCharacterWheel();
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (isLoaded) {
      loadWheelCharacters();
    }
  }, [isLoaded]);

  return (
    <div>
      <Wheel items={getWheelItems()} onWin={setWinner} />
      {winner && <CharacterCard character={winner} />}
    </div>
  );
}
```

## 🎨 Customization

### Thêm thuộc tính mới
1. Thêm vào interface trong `types/character.ts`
2. Cập nhật parser trong `characterParser.ts`
3. Cập nhật UI trong `CharacterCard.tsx`

### Thêm filter mới
1. Thêm method vào `CharacterManager.ts`
2. Tạo hook mới trong `useCharacters.ts` nếu cần

## 📊 Ví dụ thực tế

### Hiển thị top 5 nhân vật mạnh nhất
```typescript
const strongest = characterManager.getStrongestCharacters(5);
```

### Tạo wheel chỉ với nhân vật House Lannister
```typescript
const lannisterChars = characterManager.getCharactersByHouse('Lannister');
```

### Random một nhân vật có người yêu
```typescript
const withLovers = characterManager.filterCharacters({ hasLover: true });
const randomLover = withLovers[Math.floor(Math.random() * withLovers.length)];
```

---

Được tạo bởi Claude Code cho Wheel of Multiverse RE
