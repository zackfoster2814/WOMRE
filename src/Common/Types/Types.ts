export type Section = {
  id: string;
  name: string;
  weight: number;
  color: string;
  description?: string;
  word?: string;
  effect?: string;
  quest?: string;
  extraWheel?: string | string[];
  image?: string;
  usableRate?: number;
  enchants?: string[];
  usable?: boolean;
  tag?: string | string[];
  isUnique?: boolean;
};

export type WheelStep = {
  key: string;
  title: string;
  sections: Section[];
  onComplete?: () => void;
};
