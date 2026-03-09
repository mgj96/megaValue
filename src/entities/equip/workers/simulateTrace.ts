import type { SimulateTraceInput, SimulateTraceOutput } from "./types";

export const BASE_TRACE_COUNT_BY_LEVEL = (level: number) => {
  if (level <= 119) return { "15%": 170, "30%": 130, "70%": 65 };
  if (level <= 250) return { "15%": 790, "30%": 590, "70%": 295 }; // 120 이상
  return { "15%": 790, "30%": 590, "70%": 295 }; // default fallback (실제로는 더 세분화되어 있으나 단순화)
};

const getBaseSuccessRate = (type: "15%" | "30%" | "70%") => {
  switch (type) {
    case "15%": return 15;
    case "30%": return 30;
    case "70%": return 70;
  }
};

const getFeverSuccessRate = (type: "15%" | "30%" | "70%") => {
  switch (type) {
    case "15%": return 30;
    case "30%": return 45;
    case "70%": return 95;
  }
};

const simulateTraceCountOnce = (
  input: SimulateTraceInput,
): { traceCount: number; cleanSlateCount: number } => {
  const {
    type,
    // equipPart, // 장신구 등은 15%작이 시스템적으로 불가함
    diligenceLevel,
    isGuildSkillEnabled,
    sundayMaple,
    slotCount,
  } = input;
  const level = (input as SimulateTraceInput & { level?: number }).level || 200;

  const traceCountPerScroll = BASE_TRACE_COUNT_BY_LEVEL(level || 200)[type] || 0;
  const traceCountPerCleanSlate = 2000;
  const traceCostMultiplier = sundayMaple.includes("HALF_PRICE") ? 0.5 : 1.0;
  
  const baseRate =
    sundayMaple.includes("FEVER_TIME")
      ? getFeverSuccessRate(type)
      : getBaseSuccessRate(type);

  const additionalRate = diligenceLevel * 1 + (isGuildSkillEnabled ? 4 : 0);
  const successRate = Math.min(100, baseRate + additionalRate);
  
  // 10% 순백의 주문서 확률
  const cleanSlateSuccessRate = 10;
  
  let currentSlots = slotCount;
  let successfulSlots = 0;
  let usedTraces = 0;
  let usedCleanSlates = 0;
  
  // 성공할 때까지 계속 순백으로 복구
  while (successfulSlots < slotCount) {
    // 남은 슬롯만큼 주흔작 시도
    while (currentSlots > 0) {
      usedTraces += traceCountPerScroll * traceCostMultiplier;
      currentSlots--;
      if (Math.random() * 100 < successRate) {
        successfulSlots++;
      }
    }
    
    // 만약 완작이 아니라면 순백으로 복구 시도
    while (successfulSlots + currentSlots < slotCount) {
      usedTraces += traceCountPerCleanSlate * traceCostMultiplier;
      usedCleanSlates++;
      if (Math.random() * 100 < cleanSlateSuccessRate) {
        currentSlots++;
      }
    }
  }

  return { traceCount: usedTraces, cleanSlateCount: usedCleanSlates };
};

self.onmessage = (event: MessageEvent<SimulateTraceInput>) => {
  const input = event.data;
  const { simulationTotalCount, tracePrice } = input;

  const chunkCount = 100;
  const chunkSize = Math.ceil(simulationTotalCount / chunkCount);

  const costs: number[] = [];
  const usedTraces: number[] = [];
  const usedCleanSlates: number[] = [];

  for (let i = 0; i < simulationTotalCount; i++) {
    const result = simulateTraceCountOnce(input);
    const cost = result.traceCount * tracePrice;
    
    costs.push(cost);
    usedTraces.push(result.traceCount);
    usedCleanSlates.push(result.cleanSlateCount);

    if ((i + 1) % chunkSize === 0 || i === simulationTotalCount - 1) {
      self.postMessage({
        type: "calculating",
      });
    }
  }

  self.postMessage({
    type: "done",
    costs,
    usedTraces,
    usedCleanSlates,
  } satisfies SimulateTraceOutput);
};
