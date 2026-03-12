import { type Metadata } from "next";

import { Notice } from "~/app/_components";
import { ScopeProvider } from "~/app/_components/providers";
import { PageTitle } from "~/shared/ui";


import { PageContent } from "./_components/PageContent";
import { ItemScouterScope } from "./_lib/scopes";

export const metadata: Metadata = {
  title: "메이플스토리 아이템가치분석기",
  description: "스타포스 + 잠재능력 통합 비용 계산기",
  openGraph: {
    title: "메이플스토리 아이템가치분석기",
    description: "스타포스 + 잠재능력 통합 비용 계산기",
  },
  keywords: [
    "메이플스토리",
    "스타포스",
    "잠재능력",
    "큐브",
    "계산기",
    "아이템가치분석기",
    "메가치",
  ],
};

export default function Page() {
  return (
    <ScopeProvider scope={ItemScouterScope}>
      <div className="mx-auto max-w-screen-xl">
        <PageTitle endColorVar="var(--mesulive-primary)">
          아이템가치분석기
        </PageTitle>
        <Notice />
        <PageContent />
      </div>
    </ScopeProvider>
  );
}
