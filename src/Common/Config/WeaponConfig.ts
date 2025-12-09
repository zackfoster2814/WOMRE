import { WheelStep } from "../Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

const weapon_data = window.api ? await window.api.fetchAllWeapons() : [];
const unique_weapon_data = window.api ? await window.api.fetchUniqueWeapons(1) : [];
const enchant_data = window.api ? await window.api.fetchAllEnchants() : [];

export const weaponExistWheel: WheelStep = {
  key: "weapon-exist",
  title: "Weapon?",
  sections: [
    {
      id: "w0",
      name: "No Weapon",
      weight: 36,
      color: "#CCCCCC",
      description: "Không có vũ khí.",
    },
    {
      id: "w1",
      name: "Has Weapon",
      weight: 64,
      color: "#FFD700",
      description: "Nhận 1 vũ khí.",
    },
  ],
};

export const uniqueWeaponExistWheel: WheelStep = {
  key: "unique-weapon-exist",
  title: "Unique Weapon?",
  sections: [
    {
      id: "uw0",
      name: "No",
      weight: 82,
      color: "#A2D149",
      description: "Nhận 1 vũ khí thường.",
    },
    {
      id: "uw1",
      name: "Yes",
      weight: 18,
      color: "#FF69B4",
      description: "Nhận 1 vũ khí đặc biệt.",
    },
  ],
};

export const dualWieldEnchantWheel: WheelStep = {
  key: "dual-enchant",
  title: "Bạn có bao nhiêu Enchant (2 Vũ khí)",
  sections: [
    {
      id: "d0",
      name: "0 Enchant",
      weight: 20,
      color: "#CCCCCC",
      description: "Cả 2 vũ khí không có Enchant.",
    },
    {
      id: "d1",
      name: "Weapon 1: 1 Enchant",
      weight: 20,
      color: "#FFD700",
      description: "Chỉ vũ khí 1 nhận 1 Enchant.",
    },
    {
      id: "d2",
      name: "Weapon 1: 2 Enchant",
      weight: 20,
      color: "#87CEEB",
      description: "Chỉ vũ khí 1 nhận 2 Enchant.",
    },
    {
      id: "d3",
      name: "Weapon 2: 1 Enchant",
      weight: 20,
      color: "#A2D149",
      description: "Chỉ vũ khí 2 nhận 1 Enchant.",
    },
    {
      id: "d4",
      name: "Weapon 2: 2 Enchant",
      weight: 20,
      color: "#FF69B4",
      description: "Chỉ vũ khí 2 nhận 2 Enchant.",
    },
  ],
};

export const enchantCountWheel: WheelStep = {
  key: "weapon-enchant-count",
  title: "Bạn có bao nhiêu Enchant",
  sections: [
    {
      id: "e0",
      name: "0 Enchant",
      weight: 33.33,
      color: "#CCCCCC",
      description: "Vũ khí không nhận Enchant.",
    },
    {
      id: "e1",
      name: "1 Enchant",
      weight: 33.33,
      color: "#FFD700",
      description: "Vũ khí nhận 1 Enchant.",
    },
    {
      id: "e2",
      name: "2 Enchant",
      weight: 33.33,
      color: "#87CEEB",
      description: "Vũ khí nhận 2 Enchant.",
    },
  ],
};

export const weaponWheel: WheelStep = {
  key: "weapon-wheel",
  title: "Weapon Wheel",
  sections: weapon_data.map((weapon: any) => {
    const WeaponData = weapon._dataValues || weapon.dataValues || weapon;
    return {
      id: WeaponData.id,
      name: WeaponData.name,
      type: WeaponData.type,
      color: getRandomColor(),
      is_unique: WeaponData.is_unique,
      effect: WeaponData.effect,
      usage_persentage: WeaponData.usage_persentage,
      note: WeaponData.note,
    };
  }),
};

export const uniqueWeaponWheel: WheelStep = {
  key: "unique-weapon",
  title: "Unique Weapon",
  sections: unique_weapon_data.map((weapon: any) => {
    const WeaponData = weapon._dataValues || weapon.dataValues || weapon;
    return {
      id: WeaponData.id,
      name: WeaponData.name,
      type: WeaponData.type,
      color: getRandomColor(),
      is_unique: WeaponData.is_unique,
      effect: WeaponData.effect,
      usage_persentage: WeaponData.usage_persentage,
      note: WeaponData.note,
    };
  }),
};

export const enchantWheel: WheelStep = {
  key: "enchant-wheel",
  title: "Enchanted: Phù phép Weapon của bạn",
  sections: enchant_data.map((enchant: any) => {
    const enchantData = enchant._dataValues || enchant.dataValues || enchant;
    return {
      id: enchantData.id,
      name: enchantData.name,
      color: getRandomColor(),
      effect: enchantData.effect,
      weight: enchantData.weight,
    };
  }),
};
