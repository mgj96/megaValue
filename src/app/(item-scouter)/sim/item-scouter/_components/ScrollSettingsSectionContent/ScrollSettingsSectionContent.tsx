import { Switch } from "@heroui/react";
import { useMolecule } from "bunshi/react";
import { useAtom } from "jotai";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";
import { cx } from "~/shared/style";
import { Button, Input } from "~/shared/ui";
import { SectionSubtitle } from "~/shared/ui/typographies";

const SCROLL_TYPES = [
  { key: "미사용" as const, label: "미사용" },
  { key: "70%" as const, label: "70%작" },
  { key: "30%" as const, label: "30%작" },
  { key: "15%" as const, label: "15%작" },
];

export const ScrollSettingsSectionContent = () => {
  const {
    scrollTypeAtom,
    scrollTracePriceAtom,
    scrollSlotCountAtom,
    scrollDiligenceLevelAtom,
    scrollGuildSkillAtom,
    scrollSundayMapleAtom,
  } = useMolecule(ItemScouterMolecule);

  const [scrollType, setScrollType] = useAtom(scrollTypeAtom);
  const [tracePricePayload, setTracePrice] = useAtom(scrollTracePriceAtom);
  const [slotCountPayload, setSlotCount] = useAtom(scrollSlotCountAtom);
  const [diligenceLevel, setDiligenceLevel] = useAtom(scrollDiligenceLevelAtom);
  const [guildSkill, setGuildSkill] = useAtom(scrollGuildSkillAtom);
  const [sundayMaple, setSundayMaple] = useAtom(scrollSundayMapleAtom);

  const handleSundayMapleToggle = (type: "HALF_PRICE" | "FEVER_TIME") => {
    setSundayMaple((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-bold text-default-500">주흔 종류</span>
        <div className="mt-2 flex overflow-hidden rounded-xl border border-default">
          {SCROLL_TYPES.map(({ key, label }) => (
            <Button
              key={key}
              className={cx(
                "w-0 flex-1 rounded-none border-default text-sm [&:nth-child(n+2)]:border-l",
                scrollType === key && "font-bold",
              )}
              variant={scrollType === key ? "flat" : "light"}
              color={scrollType === key ? "primary" : "default"}
              radius="none"
              onPress={() => setScrollType(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {scrollType !== "미사용" && (
        <>
          <div className="flex flex-col gap-4">
            <SectionSubtitle>기본 설정</SectionSubtitle>
            <div className="flex gap-4">
              <Input
                label="주문의 흔적 가격"
                labelPlacement="outside"
                value={tracePricePayload.input}
                onValueChange={setTracePrice}
                type="number"
                endContent={<span className="text-default-400 text-sm">메소</span>}
                classNames={{ base: "flex-1" }}
              />
              <Input
                label="업그레이드 가능 횟수"
                labelPlacement="outside"
                value={slotCountPayload.input}
                onValueChange={setSlotCount}
                type="number"
                endContent={<span className="text-default-400 text-sm">회</span>}
                isInvalid={slotCountPayload.value._tag === "Left"}
                errorMessage={
                  slotCountPayload.value._tag === "Left"
                    ? slotCountPayload.value.left
                    : undefined
                }
                classNames={{ base: "flex-1" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SectionSubtitle>확률 증가 효과</SectionSubtitle>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div className="flex flex-col items-start gap-2">
                <span className="text-xs text-default-500">손재주 (Lv. {diligenceLevel * 10})</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={diligenceLevel}
                  onChange={(e) => setDiligenceLevel(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex w-full justify-between px-0.5 text-[10px] text-default-400">
                  <span>0%p</span>
                  <span className="font-bold text-primary-500">+{diligenceLevel}%p</span>
                  <span>+10%p</span>
                </div>
              </div>

              <div className="flex flex-col justify-start gap-2">
                <span className="text-xs text-default-500">
                  길드 스킬 (주문서 강화의 달인)
                </span>
                <Switch
                  isSelected={guildSkill}
                  onValueChange={setGuildSkill}
                  classNames={{ wrapper: "ml-0" }}
                  size="sm"
                >
                  <span className="text-sm">
                    {guildSkill ? "적용 (+4%p)" : "미적용"}
                  </span>
                </Switch>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-default-500">썬데이 메이플</span>
              <div className="flex overflow-hidden rounded-xl border border-default">
                <Button
                  className={cx(
                    "flex-1 rounded-none border-default text-sm",
                    sundayMaple.length === 0 && "font-bold"
                  )}
                  variant={sundayMaple.length === 0 ? "flat" : "light"}
                  color={sundayMaple.length === 0 ? "primary" : "default"}
                  radius="none"
                  onPress={() => setSundayMaple([])}
                >
                  없음
                </Button>
                <Button
                  className={cx(
                    "flex-1 rounded-none border-l border-default text-sm",
                    sundayMaple.includes("HALF_PRICE") && "font-bold"
                  )}
                  variant={sundayMaple.includes("HALF_PRICE") ? "flat" : "light"}
                  color={sundayMaple.includes("HALF_PRICE") ? "primary" : "default"}
                  radius="none"
                  onPress={() => handleSundayMapleToggle("HALF_PRICE")}
                >
                  강화 비용 50% 할인
                </Button>
                <Button
                  className={cx(
                    "flex-1 rounded-none border-l border-default text-sm",
                    sundayMaple.includes("FEVER_TIME") && "font-bold"
                  )}
                  variant={sundayMaple.includes("FEVER_TIME") ? "flat" : "light"}
                  color={sundayMaple.includes("FEVER_TIME") ? "primary" : "default"}
                  radius="none"
                  onPress={() => handleSundayMapleToggle("FEVER_TIME")}
                >
                  피버 타임
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
