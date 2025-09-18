// src/components/calendar/types.ts
export type Slot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export const SLOTS: Slot[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export const SLOT_LABEL_JA: Record<Slot, string> = {
  BREAKFAST: "朝食",
  LUNCH: "昼食",
  DINNER: "夕食",
  SNACK: "おやつ",
};

export type DaySummary = {
  dateYmd: string;
  stool?: {
    status?: "NONE" | "NORMAL" | "SOFT" | "DIARRHEA" | "HARD";
    color?: string;
    amount?: string;
    mucus?: boolean;
    blood?: boolean;
    note?: string;
  };
  slots: {
    BREAKFAST?: { notes?: string; items?: any[] };
    LUNCH?: { notes?: string; items?: any[] };
    DINNER?: { notes?: string; items?: any[] };
    SNACK?: { notes?: string; items?: any[] };
  };
};
