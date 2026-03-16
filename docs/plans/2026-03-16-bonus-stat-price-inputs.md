# 추가옵션 가격 입력 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 아이템 강화 비용 분석(item-scouter)의 추가옵션 설정에 강환/영환/심연 1회 가격(메소) 입력을 추가하고, 평균 기대 비용을 산정해 시뮬/결과(예상 총 비용)에 반영한다.

**Architecture:** 가격 상태는 bonus-stat-calc atoms에 두고, 설정 UI는 SettingSectionContent에 추가. item-scouter molecule에 보너스 스탯 기대 비용 atom을 두고 BonusStatIntegration에서 calcResult·가격으로 계산해 동기화. ResultDashboard/EfficiencyBadgeCard에서 해당 비용을 예상 총 비용에 합산.

**Tech Stack:** Jotai, React, Zod, 기존 shared/ui Input, entities/bonus-stat (ResetMethod, resetMethodLabels).

---

## Task 1: bonus-stat 가격 atoms 추가

**Files:**
- Modify: `src/app/(bonus-stat-calc)/calc/bonus-stat/_lib/atoms.tsx`

**Step 1: ResetMethod별 가격 atom 추가**

- `BonusStat.resetMethodSchema.options` 순서대로 (POWERFUL, ETERNAL, ABYSS) 각각 `atomWithStorage` 또는 일반 `atom`으로 1회 가격(메소) 보관.
- 초기값: POWERFUL 100_000, ETERNAL 2_000_000, ABYSS 10_000_000.
- 키 예: `methodPricePOWERFULAtom`, `methodPriceETERNALAtom`, `methodPriceABYSSAtom` 또는 `methodPriceAtom = atomFamily((method: ResetMethod) => atom<number>(defaults[method]))` 형태로 통일.

**Step 2: 파생 atom (선택)**

- 가격을 그대로 쓰면 되므로, 파싱 검증이 필요하면 `methodPriceParseResultAtom` 등으로 `z.number().min(0)` 적용해 유효한 숫자만 사용. UI에서 빈 값/오입력 시 0 또는 기존 값 유지 정책 결정.

**Step 3: bonusStatCalcAtoms export에 가격 atom(s) 추가**

- `export const bonusStatCalcAtoms` 객체에 새 atom(들) 추가.

**Step 4: Commit**

```bash
git add src/app/\(bonus-stat-calc\)/calc/bonus-stat/_lib/atoms.tsx
git commit -m "feat(bonus-stat): add method price atoms (POWERFUL/ETERNAL/ABYSS)"
```

---

## Task 2: 추가옵션 가격 입력 UI (SettingSectionContent)

**Files:**
- Create: `src/app/(bonus-stat-calc)/calc/bonus-stat/_components/SettingSectionContent/MethodPriceInput.tsx` (또는 강환/영환/심연 각각 작은 컴포넌트)
- Modify: `src/app/(bonus-stat-calc)/calc/bonus-stat/_components/SettingSectionContent/SettingSectionContent.tsx`

**Step 1: MethodPriceInput 컴포넌트 작성**

- Props: `method: BonusStat.ResetMethod`, 라벨은 `BonusStat.resetMethodLabels[method]` 사용.
- ETERNAL일 때만 라벨 옆에 ` (메소 동일)` 텍스트 표기.
- `~/shared/ui`의 Input 사용, type="number", min=0. value/onValueChange는 해당 method의 가격 atom과 연결 (useAtom 또는 scope 내 useAtomValue/useSetAtom).

**Step 2: SettingSectionContent에 세 입력 추가**

- 기존 그리드/레이아웃 아래 또는 적절한 위치에 위→아래 순서: POWERFUL, ETERNAL, ABYSS.
- 각각 `MethodPriceInput` 또는 동일한 패턴의 입력 한 줄씩 렌더.

**Step 3: Commit**

```bash
git add src/app/\(bonus-stat-calc\)/calc/bonus-stat/_components/SettingSectionContent/
git commit -m "feat(bonus-stat): add method price inputs (강환/영환/심연), ETERNAL with (메소 동일)"
```

---

## Task 3: 보너스 스탯 기대 비용 계산 및 molecule 동기화

**Files:**
- Modify: `src/app/(item-scouter)/sim/item-scouter/_lib/molecule.ts`
- Modify: `src/app/(item-scouter)/sim/item-scouter/_components/BonusStatIntegration.tsx`

**Step 3-1: molecule에 bonusStatExpectedCostAtom 추가**

- `bonusStatExpectedCostAtom = atom<number>(0)`.
- 반환 객체에 `bonusStatExpectedCostAtom` 추가.

**Step 3-2: BonusStatIntegration에서 동기화**

- `useMolecule(ItemScouterMolecule)`로 `bonusStatExpectedCostAtom` 취득.
- `useCalcResult()`로 `result` (Record<ResetMethod, number | undefined>), bonus-stat 가격 atoms로 각 method별 기대 횟수(1/prob) × 가격 합산.
- `useEffect` 또는 파생 atom이 아닌 “쓰기”가 필요하므로: BonusStatIntegration 내부에 작은 동기화 컴포넌트를 두고, `result`와 가격 atoms를 구독한 뒤 `set(bonusStatExpectedCostAtom, sum)` 호출. (또는 atomWithDefault + 외부에서 set하는 패턴.)

**Step 3-3: 계산식**

- method별: `prob = result[method]`가 number이고 > 0이면 기대 횟수 = 1/prob, 기대 비용 = (1/prob) * price[method]. 세 method 합산.

**Step 4: Commit**

```bash
git add src/app/\(item-scouter\)/sim/item-scouter/_lib/molecule.ts src/app/\(item-scouter\)/sim/item-scouter/_components/BonusStatIntegration.tsx
git commit -m "feat(item-scouter): sync bonus stat expected cost to molecule"
```

---

## Task 4: 예상 총 비용에 보너스 스탯 비용 반영

**Files:**
- Modify: `src/app/(item-scouter)/sim/item-scouter/_components/ResultDashboard/ResultDashboard.tsx`
- Modify: `src/app/(item-scouter)/sim/item-scouter/_components/ResultDashboard/EfficiencyBadgeCard.tsx`

**Step 4-1: ResultDashboard에서 bonusStatExpectedCostAtom 구독**

- `useMolecule`로 `bonusStatExpectedCostAtom` 추가, `useAtomValue(bonusStatExpectedCostAtom)`.

**Step 4-2: EfficiencyBadgeCard에 bonusStatExpectedCost 전달**

- Props에 `bonusStatExpectedCost?: number` 추가. 기본값 0.

**Step 4-3: EfficiencyBadgeCard 내부 totalCost 수정**

- `totalCost = sfCost + potCost + scrollCost + (bonusStatExpectedCost ?? 0)`.

**Step 4-4: Commit**

```bash
git add src/app/\(item-scouter\)/sim/item-scouter/_components/ResultDashboard/ResultDashboard.tsx src/app/\(item-scouter\)/sim/item-scouter/_components/ResultDashboard/EfficiencyBadgeCard.tsx
git commit -m "feat(item-scouter): include bonus stat expected cost in total cost display"
```

---

## Task 5: 검증 및 정리

**Step 5-1: 수동 검증**

- item-scouter 페이지에서 추가옵션 설정에 강환 100,000 / 영환 2,000,000 / 심연 10,000,000 노출 확인.
- 영환 라벨에만 "(메소 동일)" 표기 확인.
- 계산 후 추가옵션 기댓값 결과가 나온 뒤, 예상 총 비용에 보너스 스탯 기대 비용이 더해지는지 확인.

**Step 5-2: 기존 테스트 실행**

- `pnpm test` (또는 해당 경로 테스트) 실행해 회귀 없음 확인.

**Step 5-3: Commit (필요 시)**

- 문서/주석 정리 등 추가 변경이 있으면 커밋.

---

## 참고

- 설계 문서: `docs/plans/2026-03-16-bonus-stat-price-inputs-design.md`
- 보너스 스탯 확률: `calcResult` (getMethodProbRecord 워커 결과), Bernoulli 기대 횟수 = 1/prob.
- 가격은 스타포스/큐브/주문의 흔적과 동일하게 “1회 비용(메소)” 단위.
