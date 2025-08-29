export type Section = {
  id: string;
  name: string;
  weight: number;
  color: string;
  description: string;
};

export type WheelStep = {
  key: string;
  title: string;
  sections: Section[];
};
