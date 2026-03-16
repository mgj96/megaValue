"use client";

import { semanticColors } from "@heroui/react";
import type Highcharts from "highcharts";
import { useEffect, useMemo, useRef } from "react";

import { putUnit } from "~/shared/number";
import { primary } from "~/shared/style/colors";

export interface GoalSuccessCurvePoint {
  budget: number;
  successProbability: number;
}

interface GoalSuccessCurveChartProps {
  data: GoalSuccessCurvePoint[];
  /** 차트 컨테이너 높이 (px) */
  height?: number;
}

export const GoalSuccessCurveChart = ({
  data,
  height = 240,
}: GoalSuccessCurveChartProps) => {
  const chartContainerId = "goal-success-curve-chart";
  const chartRef = useRef<Highcharts.Chart | null>(null);

  const sortedData = useMemo(
    () => [...data].sort((a, b) => a.budget - b.budget),
    [data],
  );

  const options: Highcharts.Options = useMemo(
    () => ({
      chart: { type: "line" },
      title: { text: "" },
      credits: { enabled: false },
      xAxis: {
        title: {
          text: "예산 (메소)",
          style: { color: semanticColors.light.default[500] },
        },
        labels: {
          formatter() {
            const v =
              typeof this.value === "number" ? this.value : Number(this.value);
            return putUnit(v);
          },
          style: { color: semanticColors.light.default[500] },
        },
        lineColor: semanticColors.light.default[300],
        tickColor: semanticColors.light.default[300],
      },
      yAxis: {
        title: {
          text: "목표 달성 확률 (%)",
          style: { color: semanticColors.light.default[500] },
        },
        min: 0,
        max: 100,
        labels: {
          format: "{value}%",
          style: { color: semanticColors.light.default[500] },
        },
        lineColor: semanticColors.light.default[300],
        tickColor: semanticColors.light.default[300],
      },
      tooltip: {
        shadow: false,
        borderWidth: 0,
        borderRadius: 12,
        padding: 10,
        backgroundColor: primary[600],
        style: { color: "white" },
        formatter() {
          const x = this.x as number;
          const y = this.y as number;
          return `${putUnit(x)} 메소 · <b>${y.toFixed(1)}%</b>`;
        },
      },
      series: [
        {
          name: "성공 확률",
          type: "line",
          data: sortedData.map((d) => [d.budget, d.successProbability * 100]),
          color: primary[500],
          marker: { enabled: true, radius: 4 },
          lineWidth: 2,
        },
      ],
      plotOptions: {
        line: {
          dataLabels: { enabled: false },
        },
      },
    }),
    [sortedData],
  );

  useEffect(() => {
    if (sortedData.length === 0) return;

    let isMounted = true;

    const loadChart = async () => {
      const Highcharts = (await import("highcharts")).default;
      if (!isMounted) return;
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      chartRef.current = Highcharts.chart(chartContainerId, options);
    };

    loadChart();

    return () => {
      isMounted = false;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartContainerId, options, sortedData.length]);

  if (sortedData.length === 0) {
    return (
      <p className="text-sm text-default-400">
        예산을 여러 구간으로 시뮬레이션하면 곡선을 볼 수 있습니다.
      </p>
    );
  }

  return (
    <div
      className="w-full"
      id={chartContainerId}
      style={{ height: `${height}px` }}
    />
  );
};
