import type { Metadata } from "next";
import Link from "next/link";

import { PageTitle } from "~/components/page-title";
import { cx } from "~/shared/style";

import { GameScreen } from "./game/GameScreen";
import { TablePanel } from "./TablePanel";

export const metadata: Metadata = { title: "스타포스 | 메이플 장비 진단" };

const TABS = [
  { key: "game", label: "게임", href: "/starforce" },
  { key: "table", label: "계산표", href: "/starforce?tab=table" },
] as const;

export default async function StarforcePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // 예전 /starforce?level=&star= 주소는 계산표로 보낸다.
  const tab = params.tab === "table" || (!params.tab && (params.level || params.star)) ? "table" : "game";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageTitle>스타포스</PageTitle>

      <nav
        aria-label="스타포스 보기"
        className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
      >
        {TABS.map(({ key, label, href }) => (
          <Link
            key={key}
            href={href}
            aria-current={tab === key ? "page" : undefined}
            className={cx(
              "rounded-md px-3 py-1.5 text-center text-sm font-medium transition-all",
              tab === key && "bg-background text-foreground shadow",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "table" ? <TablePanel searchParams={params} /> : <GameScreen />}
    </div>
  );
}
