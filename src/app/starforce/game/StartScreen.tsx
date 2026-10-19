"use client";

import { useState } from "react";

import { SectionContainer } from "~/components/section-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { formatMeso } from "~/format";
import { newGame, type GameData, type GameState } from "~/game";
import { cn } from "~/shared/style";

import { fetchGameData, fetchMyItems, type MyItem } from "./api";

const START_CHOICES = [3e9, 1e10, 5e10];
const SCRATCH_LEVELS = [140, 150, 160, 200, 250];

export const StartScreen = ({
  onStart,
}: {
  onStart: (state: GameState, data: GameData) => void;
}) => {
  const [level, setLevel] = useState(200);
  const [characterName, setCharacterName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [items, setItems] = useState<MyItem[] | null>(null);
  const [picked, setPicked] = useState<MyItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const data = await fetchGameData(level);
      onStart(newGame({ mode: "scratch", level, meso }), data);
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
          startAssets: meso + data.values[picked.star],
        }),
        data,
      );
    });

  const loadItems = () =>
    run(async () => {
      if (/[^\x20-\x7E]/.test(apiKey)) {
        throw new Error("넥슨 오픈 API 키에는 영문·숫자만 들어가요. 한/영 전환 상태를 확인해 주세요.");
      }
      setPicked(null);
      setItems(await fetchMyItems(characterName, apiKey));
    });

  const mesoButtons = (start: (meso: number) => void, disabled: boolean) => (
    <div className="flex flex-wrap gap-2">
      {START_CHOICES.map((meso) => (
        <Button key={meso} disabled={disabled || busy} onClick={() => start(meso)}>
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
              장비 레벨을 고르고 ★0 장비를 사서 처음부터 올려요. 판매가는 시세가 아니라 &quot;대체 장비 + 그 성까지
              키우는 기대 비용&quot;이라는 가정값이에요.
            </p>
            <div>
              <p className="mb-2 text-sm font-medium">장비 레벨</p>
              <div className="flex flex-wrap gap-2">
                {SCRATCH_LEVELS.map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={level === value ? "default" : "outline"}
                    onClick={() => setLevel(value)}
                  >
                    {value}제
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">시작 자금</p>
              {mesoButtons(startScratch, false)}
            </div>
          </TabsContent>

          <TabsContent value="mine" className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              내 캐릭터의 장비를 불러와서 고른 장비의 현재 성에서 이어서 올려요. 키는 이 요청에만 쓰이고 저장되지
              않아요.
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
                <p className="mb-2 text-sm font-medium">올릴 장비를 고르세요</p>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">스타포스를 할 수 있는 장비가 없어요.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((item) => {
                      const done = item.star >= item.maxStar;
                      return (
                        <li key={`${item.slot}-${item.name}`}>
                          <button
                            type="button"
                            disabled={done}
                            onClick={() => setPicked(item)}
                            className={cn(
                              "w-full rounded-lg border p-3 text-left text-sm transition-colors disabled:opacity-50",
                              picked === item ? "border-primary bg-accent" : "hover:bg-accent",
                            )}
                          >
                            <span className="font-semibold">{item.slot}</span> · {item.name}
                            <span className="block text-xs text-muted-foreground">
                              {item.level}제 · ★{item.star} / {item.maxStar}
                              {done ? " · 최대 성" : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {picked && (
              <div>
                <p className="mb-2 text-sm font-medium">보유 메소</p>
                {mesoButtons(startMine, false)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </SectionContainer>
    </div>
  );
};
