"use client";

import { SectionContainer } from "~/shared/ui";

import { BasicSettings } from "./BasicSettings";
import { CalculateButton } from "./CalculateButton";
import { PotentialSettings } from "./PotentialSettings";
import { ResultDashboard } from "./ResultDashboard";
import { StarforceSettings } from "./StarforceSettings";

export const PageContent = () => {
  return (
    <div className="mt-4 flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-col gap-4 lg:w-0 lg:flex-1">
        <SectionContainer title="장비 설정">
          <BasicSettings />
        </SectionContainer>
        <SectionContainer title="스타포스 설정">
          <StarforceSettings />
        </SectionContainer>
        <SectionContainer title="잠재능력 설정">
          <PotentialSettings />
        </SectionContainer>
        <CalculateButton />
      </div>

      <div className="lg:min-h-full lg:w-0 lg:flex-1">
        <SectionContainer title="계산 결과" className="lg:h-full">
          <ResultDashboard />
        </SectionContainer>
      </div>
    </div>
  );
};
