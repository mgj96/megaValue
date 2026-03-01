import { type Starforce } from "~/entities/starforce";
import { type Potential } from "~/entities/potential";

export type ItemScouterResult = {
  starforce: number[] | null; // sorted costs from simulation
  potential: PotentialCostResult | null;
};

export type PotentialCostResult = {
  method: Potential.ResetMethod;
  expectedCount: number; // 평균 큐브 횟수
  expectedCost: number; // 평균 비용 (메소)
  gradeUpExpectedCount?: number; // 등급업 평균 큐브 횟수 (등급업 목표인 경우)
  gradeUpExpectedCost?: number; // 등급업 평균 비용
};

export type ItemScouterStarforceInputs = {
  level: number;
  currentStar: number;
  targetStar: number;
  spareCost: number;
  simulationCount: number;
  safeguardRecord: { [key: `${number}`]: boolean };
  starcatchRecord: { [key: `${number}`]: boolean };
  event: Starforce.Event | null;
  discounts: Starforce.Discount[];
};

export type ItemScouterPotentialInputs = {
  level: number;
  grade: Potential.Grade;
  targetGrade: Potential.Grade;
  resetMethod: Potential.ResetMethod;
  cubePricePerMethod: Partial<Record<Potential.ResetMethod, number>>;
  aimType: "GRADE_UP" | "OPTIONS";
};
