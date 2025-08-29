// StrengthConfig.ts
import { WheelStep } from "@/Common/Types/Types";

export const strengthWheel: WheelStep = {
  key: "strength",
  title: "Strength",
  sections: [
    { id: "s1", name: "Weak", weight: 2, color: "#555555" },
    { id: "s2", name: "Average", weight: 5, color: "#999999" },
    { id: "s3", name: "Strong", weight: 3, color: "#cc3333" },
    { id: "s4", name: "Legendary", weight: 1, color: "#ffd700" },
  ],
};
