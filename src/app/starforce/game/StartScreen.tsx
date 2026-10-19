"use client";

import { useState } from "react";

import { EquipmentWindow } from "~/components/equipment-window";
import { ItemVisual } from "~/components/item-visual";
import { SectionContainer } from "~/components/section-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { formatMeso } from "~/format";
import { newGame, type GameData, type GameState } from "~/game";
import { ITEM_SETS, SLOT_NAMES, setById, type SlotId } from "~/items";
import { cn } from "~/shared/style";

import { fetchGameData, fetchMyItems, type MyItem } from "./api";

const START_CHOICES = [3e9, 1e10, 5e10];

export const StartScreen = ({
  onStart,
}: {
  onStart: (state: GameState, data: GameData) => void;
}) => {
  const [setId, setSetId] = useState(ITEM_SETS[ITEM_SETS.length - 1].id);
  const [slot, setSlot] = useState<SlotId | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [items, setItems] = useState<MyItem[] | null>(null);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = setById(setId)!;
  const keyOf = (item: MyItem) => `${item.slot}-${item.name}`;
  const picked = items?.find((item) => keyOf(item) === pickedKey) ?? null;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제가 생겼어요.");
    } finally {
      setBusy(false);
    }
  };

  const startScratch = (meso: number) =>
    run(async () => {
      if (!slot) return;
      const data = await fetchGameData(set.level);
      onStart(
        newGame({
          mode: "scratch",
          level: set.level,
          meso,
          itemName: `${set.name} ${SLOT_NAMES[slot]}`,
          setId: set.id,
          slot,
        }),
        data,
      );
    });

  const startMine = (meso: number) =>
    run(async () => {
      if (!picked) return;
      const data = await fetchGameData(picked.level);
      onStart(
        newGame({
          mode: "mine",
          level: picked.level,
          meso,
          star: picked.star,
          itemName: `${picked.slot} ${picked.name}`,
          icon: picked.icon || null,
          startAssets: meso + data.values[picked.star],
        }),
        data,
      );
    });

  const loadItems = () =>
    run(async () => {
      if (/[^\x20-\x7E]/.test(apiKey)) {
        throw new Error("넥슨 오픈 API 키에는 영문과 숫자만 들어가요. 한/영 전환 상태를 확인해 주세요.");
      }
      setPickedKey(null);
      setItems(await fetchMyItems(characterName, apiKey));
    });

  const mesoButtons = (start: (meso: number) => void) => (
    <div className="flex flex-wrap gap-2">
      {START_CHOICES.map((meso) => (
        <Button key={meso} disabled={busy} onClick={() => start(meso)}>
          {formatMeso(meso)} 메소로 시작
        </Button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <SectionContainer>
        <Tabs defaultValue="scratch">
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value="scratch">처음부터 하기</TabsTrigger>
            <TabsTrigger value="mine">내 장비로 하기</TabsTrigger>
          </TabsList>

          <TabsContent value="scratch" className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              세트와 부위를 고르면 ★0 장비를 사서 처음부터 올려요. 판매가는 원가로 계산한 가정값이고 실제 시세와는
              달라요.
            </p>

            <div>
              <p className="mb-2 text-sm font-medium">세트</p>
              <div className="flex flex-wrap gap-2">
                {ITEM_SETS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSetId(option.id);
                      setSlot(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 text-sm transition-all active:scale-95",
                      option.id === setId ? "border-primary bg-accent" : "border-transparent bg-muted hover:bg-accent",
                    )}
                  >
                    <ItemVisual setId={option.id} slot={option.slots[0]} className="size-6" />
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">{set.name} 부위</p>
              <EquipmentWindow
                selected={slot}
                onSelect={(key) => setSlot(key as SlotId)}
                tiles={set.slots.map((id) => ({
                  key: id,
                  label: SLOT_NAMES[id],
                  icon: <ItemVisual setId={set.id} slot={id} label={`${set.name} ${SLOT_NAMES[id]}`} />,
                }))}
              />
            </div>

            {slot && (
              <div>
                <p className="mb-2 text-sm font-medium">시작 자금</p>
                {mesoButtons(startScratch)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine" className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              캐릭터의 장비를 불러와 고른 장비의 현재 성에서 이어서 올려요. 키는 이 요청에만 쓰고 저장하지 않아요.
            </p>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                캐릭터 이름
                <Input
                  value={characterName}
                  onChange={(event) => setCharacterName(event.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                넥슨 오픈 API 키
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  autoComplete="off"
                />
              </label>
              <Button disabled={busy || !characterName.trim()} onClick={loadItems}>
                {busy && !items ? "불러오는 중…" : "장비 불러오기"}
              </Button>
            </div>

            {items && (
              <div>
                <p className="mb-2 text-sm font-medium">올릴 장비를 누르세요</p>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">스타포스를 할 수 있는 장비가 없어요.</p>
                ) : (
                  <EquipmentWindow
                    selected={pickedKey}
                    onSelect={setPickedKey}
                    tiles={items.map((item) => ({
                      key: keyOf(item),
                      label: item.slot,
                      badge: `★${item.star}`,
                      disabled: item.star >= item.maxStar,
                      icon: <ItemVisual icon={item.icon} slot="weapon" label={item.name} />,
                    }))}
                  />
                )}
                {picked && <p className="mt-2 text-xs text-muted-foreground">{picked.name}</p>}
              </div>
            )}

            {picked && (
              <div>
                <p className="mb-2 text-sm font-medium">보유 메소</p>
                {mesoButtons(startMine)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </SectionContainer>
    </div>
  );
};
