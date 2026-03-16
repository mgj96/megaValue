"use client";

import { SectionContainer } from "~/shared/ui";

import { BasicSettingsSectionContent } from "./BasicSettingsSectionContent/BasicSettingsSectionContent";
import { CalculateButton } from "./CalculateButton";
import { PotentialSettingsSectionContent } from "./PotentialSettingsSectionContent/PotentialSettingsSectionContent";
import { ResultDashboard } from "./ResultDashboard/ResultDashboard";
import { ScrollSettingsSectionContent } from "./ScrollSettingsSectionContent/ScrollSettingsSectionContent";
import { StarforceSettingsSectionContent } from "./StarforceSettingsSectionContent/StarforceSettingsSectionContent";
import { BonusStatIntegration } from "./BonusStatIntegration";

export const PageContent = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 및 핵심 결과 요약 (Top Dashboard) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold md:text-2xl">아이템 강화 비용 분석</h1>
          <CalculateButton />
        </div>
        
        {/* 상단 결과창: 스크롤 시 상단 고정(Sticky)를 위해 sticky 클래스 부여 */}
        <div className="sticky top-0 z-50 rounded-xl bg-content1 p-4 shadow-sm border border-default-200">
          <ResultDashboard />
        </div>
      </div>

      {/* 하단 3칼럼 폼 입력 그리드 (Bottom Inputs) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Col 1: 장비 (기본 설정) + 스타포스 설정 */}
        <div className="flex flex-col gap-4">
          <SectionContainer title="기본 설정">
            <BasicSettingsSectionContent />
          </SectionContainer>
          <SectionContainer title="스타포스 설정">
            <StarforceSettingsSectionContent />
          </SectionContainer>
        </div>

        {/* Col 2: 주문의 흔적 설정 + 추옵 계산기 (모니터링 포함) */}
        <div className="flex flex-col gap-4">
          <SectionContainer title="주문의 흔적 설정">
            <ScrollSettingsSectionContent />
          </SectionContainer>
          <BonusStatIntegration />
        </div>

        {/* Col 3: 잠재능력 설정 */}
        <div className="flex flex-col gap-4">
          <SectionContainer>
            <PotentialSettingsSectionContent />
          </SectionContainer>
        </div>
      </div>
    </div>
  );
};
