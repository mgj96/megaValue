"use client";

import { useRef, useState, type FormEvent } from "react";

import { PageTitle } from "~/components/page-title";
import { SectionContainer } from "~/components/section-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cx } from "~/shared/style";

type Message = { role: "user" | "assistant"; text: string };

const GEMINI_URL = "https://gemini.google.com/app";

export const ChatScreen = () => {
  const [apiKey, setApiKey] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "캐릭터 이름과 본인의 넥슨 오픈 API 키를 넣으면 장비를 진단해 드려요. 키는 이 요청에만 쓰이고 저장되지 않아요.",
    },
  ]);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const push = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    queueMicrotask(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading || !characterName.trim()) return;

    if (/[^\x20-\x7E]/.test(apiKey)) {
      push({
        role: "assistant",
        text: "넥슨 오픈 API 키에는 영문·숫자만 들어가요. 한/영 전환 상태나 붙여 넣은 내용을 확인해 주세요.",
      });
      return;
    }

    push({ role: "user", text: `${characterName.trim()} 장비 진단해줘` });
    setLoading(true);
    setPrompt(null);
    setCopied(false);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "content-type": "application/json", "x-nxopen-api-key": apiKey.trim() },
        body: JSON.stringify({ characterName: characterName.trim() }),
      });
      const data = (await response.json()) as { reply?: string; prompt?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error ?? "조회에 실패했어요.");
      push({ role: "assistant", text: data.reply });
      setPrompt(data.prompt ?? null);
    } catch (error) {
      push({
        role: "assistant",
        text: error instanceof Error ? error.message : "조회에 실패했어요.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageTitle>메이플 장비 진단</PageTitle>

      <SectionContainer className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cx(
              "max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
              message.role === "user"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-muted text-foreground/90",
            )}
          >
            {message.text}
          </div>
        ))}
        {loading && (
          <div className="self-start rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            장비를 불러오는 중이에요…
          </div>
        )}
        <div ref={bottomRef} />
      </SectionContainer>

      {prompt && (
        <SectionContainer title="Gemini에게 물어보기">
          <p className="mb-3 text-sm text-muted-foreground">
            아래 진단 프롬프트를 복사해서 Gemini(또는 다른 AI)에 붙여 넣으면, 이 장비의 계산값과 규칙을
            근거로 판단해 줘요. 데이터에 없는 수치는 모른다고 답하도록 지시해 두었어요.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button onClick={copyPrompt}>{copied ? "복사됨" : "프롬프트 복사"}</Button>
            <Button variant="secondary" asChild>
              <a href={GEMINI_URL} target="_blank" rel="noreferrer">
                Gemini 열기
              </a>
            </Button>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">프롬프트 미리보기</summary>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">
              {prompt}
            </pre>
          </details>
        </SectionContainer>
      )}

      <SectionContainer>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
            <span className="text-xs font-normal text-muted-foreground">
              본인 키를 직접 입력하세요. 서버에 저장하지 않습니다.
            </span>
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? "조회 중…" : "진단하기"}
          </Button>
        </form>
      </SectionContainer>
    </div>
  );
};
