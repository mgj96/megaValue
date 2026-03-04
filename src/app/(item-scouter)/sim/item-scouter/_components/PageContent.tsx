"use client";

import { SectionContainer } from "~/shared/ui";

import { BasicSettingsSectionContent } from "./BasicSettingsSectionContent/BasicSettingsSectionContent";
import { CalculateButton } from "./CalculateButton";
import { PotentialSettingsSectionContent } from "./PotentialSettingsSectionContent/PotentialSettingsSectionContent";
import { ResultDashboard } from "./ResultDashboard/ResultDashboard";
import { ScrollSettingsSectionContent } from "./ScrollSettingsSectionContent/ScrollSettingsSectionContent";
import { StarforceSettingsSectionContent } from "./StarforceSettingsSectionContent/StarforceSettingsSectionContent";

export const PageContent = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* 페이지 헤더: 타이틀 + 시뮬레이션 시작 버튼 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">아이템 강화 비용 분석</h1>
        <CalculateButton />
      </div>

      {/* 3칼럼 그리드 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_420px]">
        {/* Col 1: 기본 설정 + 스타포스 설정 */}
        <div className="flex flex-col gap-4">
          <SectionContainer title="기본 설정">
            <BasicSettingsSectionContent />
          </SectionContainer>
          <SectionContainer title="스타포스 설정">
            <StarforceSettingsSectionContent />
          </SectionContainer>
        </div>

        {/* Col 2: 주흔작 설정 + 잠재능력 설정 */}
        <div className="flex flex-col gap-4">
          <SectionContainer title="주흔작 설정">
            <ScrollSettingsSectionContent />
          </SectionContainer>
          <SectionContainer>
            <PotentialSettingsSectionContent />
          </SectionContainer>
        </div>

        {/* Col 3: 계산 결과 (sticky) */}
        <div className="xl:sticky xl:top-8 xl:self-start">
          <SectionContainer title="계산 결과" className="xl:min-h-[600px]">
            <ResultDashboard />
          </SectionContainer>
        </div>
      </div>
    </div>
  );
};
