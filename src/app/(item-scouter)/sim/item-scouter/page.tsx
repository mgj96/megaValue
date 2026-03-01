import { type Metadata } from "next";

import { Notice } from "~/app/_components";
import { ScopeProvider } from "~/app/_components/providers";
import { PageTitle } from "~/shared/ui";

import { LoadHighCharts } from "./_components/LoadHighCharts";
import { PageContent } from "./_components/PageContent";
import { ItemScouterScope } from "./_lib/scopes";

export const metadata: Metadata = {
  title: "메이플스토리 아이템 스카우터",
  description: "스타포스 + 잠재능력 통합 비용 계산기",
  openGraph: {
    title: "메이플스토리 아이템 스카우터",
    description: "스타포스 + 잠재능력 통합 비용 계산기",
  },
  keywords: [
    "메이플스토리",
    "스타포스",
    "잠재능력",
    "큐브",
    "계산기",
    "스카우터",
  ],
};

export default function Page() {
  return (
    <ScopeProvider scope={ItemScouterScope}>
      <div className="mx-auto max-w-screen-xl">
        <PageTitle endColorVar="var(--mesulive-primary)">
          아이템 스카우터
        </PageTitle>
        <Notice />
        <PageContent />
      </div>
      <LoadHighCharts />
    </ScopeProvider>
  );
}
