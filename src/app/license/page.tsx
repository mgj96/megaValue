import { readFileSync } from "fs";
import path from "path";

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "~/components/ui/button";

export const metadata: Metadata = {
  title: "오픈소스 라이센스 | 메수라이브",
  description: "본 프로젝트의 오픈소스 라이센스 (GNU Affero GPL v3)",
};

export default function LicensePage() {
  const licensePath = path.join(process.cwd(), "LICENSE");
  const content = readFileSync(licensePath, "utf-8");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Open Source License</h1>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">
        {content}
      </pre>
    </div>
  );
}
