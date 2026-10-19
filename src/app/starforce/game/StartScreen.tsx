"use client";

import { useState } from "react";

import { EquipmentWindow } from "~/components/equipment-window";
import { ItemVisual } from "~/components/item-visual";
import { SectionContainer } from "~/components/section-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { formatMeso } from "~/format";
import { dataKeyOf, newGame, type GameData, type GameItem, type GameState } from "~/game";
import { DEFAULT_PRICE, ITEM_SETS, SLOT_NAMES, SLOT_TO_EQUIPMENT_SLOT, priceOf, setById } from "~/items";
import { cn } from "~/shared/style";

import { fetchGameData, fetchMyItems, type MyCharacter, type MyItem } from "./api";

const START_CHOICES = [1e10, 5e10, 2e11];

type DataMap = Record<string, GameData>;

const loadData = async (items: Pick<GameItem, "level" | "price">[]): Promise<DataMap> => {
  const unique = new Map(items.map((item) => [dataKeyOf(item), item]));
  const entries = await Promise.all(
    [...unique].map(async ([key, item]) => [key, await fetchGameData(item.level, item.price)] as const),
  );
  return Object.fromEntries(entries);
};

export const StartScreen = ({
  onStart,
}: {
  onStart: (state: GameState, data: DataMap) => void;
}) => {
  const [setId, setSetId] = useState(ITEM_SETS[ITEM_SETS.length - 1].id);
  const [characterName, setCharacterName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [items, setItems] = useState<MyItem[] | null>(null);
  const [character, setCharacter] = useState<MyCharacter>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = setById(setId)!;
  const setItemsOf = set.slots.map<GameItem>((id) => ({
    key: id,
    equipSlot: SLOT_TO_EQUIPMENT_SLOT[id],
    slot: SLOT_NAMES[id],
    name: `${set.name} ${SLOT_NAMES[id]}`,
    setId: set.id,
    slotId: id,
    icon: null,
    level: set.level,
    price: priceOf(set.id, id),
    star: null,
    maxStarReached: 0,
  }));

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
      onStart(newGame({ mode: "scratch", meso, items: setItemsOf }), await loadData(setItemsOf));
    });

  const startMine = (meso: number) =>
    run(async () => {
      if (!items?.length) return;
      const mine = items.map<GameItem>((item, index) => ({
        key: `${index}-${item.slot}`,
        equipSlot: item.slot,
        slot: item.slot,
        name: item.name,
        setId: null,
        slotId: null,
        icon: item.icon || null,
        level: item.level,
        price: DEFAULT_PRICE,
        star: item.star,
        maxStarReached: item.star,
      }));
      const dataMap = await loadData(mine);
      const worth = mine.reduce((sum, item) => sum + dataMap[dataKeyOf(item)].values[item.star ?? 0], 0);
      onStart(newGame({ mode: "mine", meso, items: mine, startAssets: meso + worth, character }), dataMap);
    });

  const loadItems = () =>
    run(async () => {
      if (/[^\x20-\x7E]/.test(apiKey)) {
        throw new Error("넥슨 오픈 API 키에는 영문과 숫자만 들어가요. 한/영 전환 상태를 확인해 주세요.");
      }
      const result = await fetchMyItems(characterName, apiKey);
      setItems(result.items);
      setCharacter(result.character);
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
              세트를 고르면 그 세트 장비를 부위별로 하나씩 사서 ★0부터 올려요. 장비를 하나씩 키워 캐릭터 스펙을 쌓는
              게임이고, 판매가는 원가로 계산한 가정값이에요. 가격도 시세가 아니라 기본값이에요.
            </p>

            <div>
              <p className="mb-2 text-sm font-medium">세트</p>
              <div className="flex flex-wrap gap-2">
                {ITEM_SETS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSetId(option.id)}
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
              <p className="mb-2 text-sm font-medium">{set.name} 장비</p>
              <EquipmentWindow
                selected={null}
                center={
                  <>
                    <p className="text-sm font-bold">{set.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">부위 {set.slots.length}개</p>
                  </>
                }
                tiles={setItemsOf.map((entry) => ({
                  key: entry.key,
                  equipSlot: entry.equipSlot,
                  label: `${entry.slot} ${formatMeso(entry.price)}`,
                  icon: <ItemVisual setId={set.id} slot={entry.slotId} label={entry.name} />,
                }))}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                장비 가격은 칸에 마우스를 올리면 보여요. 지금은 모두 기본값 {formatMeso(DEFAULT_PRICE)}이에요.
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">시작 자금</p>
              {mesoButtons(startScratch)}
            </div>
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
              <div className="flex flex-col gap-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">스타포스를 할 수 있는 장비가 없어요.</p>
                ) : (
                  <>
                    <div>
                      <p className="mb-2 text-sm font-medium">불러온 장비 {items.length}개</p>
                      <EquipmentWindow
                        selected={null}
                        center={<CharacterPortrait character={character} />}
                        tiles={items.map((item, index) => ({
                          key: `${index}-${item.slot}`,
                          equipSlot: item.slot,
                          label: `${item.slot} ${item.name}`,
                          badge: `★${item.star}`,
                          icon: <ItemVisual icon={item.icon} slot="weapon" label={item.name} />,
                        }))}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">보유 메소</p>
                      {mesoButtons(startMine)}
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </SectionContainer>
    </div>
  );
};

export const CharacterPortrait = ({ character }: { character: MyCharacter }) =>
  character ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={character.image}
        alt={character.name}
        referrerPolicy="no-referrer"
        className="max-h-28 object-contain"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="mt-1 truncate text-xs font-semibold">{character.name}</p>
    </>
  ) : (
    <p className="text-xs text-muted-foreground">캐릭터</p>
  );
