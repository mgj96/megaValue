import type { Equip } from "~/entities/equip";

export type SimulateTraceInput = {
  type: "70%" | "30%" | "15%";
  tracePrice: number;
  slotCount: number;
  diligenceLevel: number; // 0~10
  isGuildSkillEnabled: boolean;
  sundayMaple: ("HALF_PRICE" | "FEVER_TIME")[];
  equipPart: Equip;
  simulationTotalCount: number;
};

export type SimulateTraceOutput =
  | { type: "calculating" }
  | {
      type: "done";
      costs: number[]; // total mesos
      usedTraces: number[]; // trace count
      usedCleanSlates: number[]; // clean slate count
    };
