"use client";

import { useMolecule } from "bunshi/react";
import { useSetAtom } from "jotai";
import Script from "next/script";
import { useEffect, useState } from "react";

import { ItemScouterMolecule } from "~/app/(item-scouter)/sim/item-scouter/_lib/molecule";

export const LoadHighCharts = () => {
  const { isHighchartsLoadedAtom } = useMolecule(ItemScouterMolecule);
  const setIsHighchartsLoaded = useSetAtom(isHighchartsLoadedAtom);

  const [isBaseLoaded, setIsBaseLoaded] = useState(false);
  const [isHistogramLoaded, setIsHistogramLoaded] = useState(false);

  useEffect(() => {
    if (isBaseLoaded && isHistogramLoaded) {
      setIsHighchartsLoaded(true);
    }
  }, [isBaseLoaded, isHistogramLoaded, setIsHighchartsLoaded]);

  return (
    <>
      <Script
        src="https://code.highcharts.com/12.1.2/highcharts.js"
        onReady={() => setIsBaseLoaded(true)}
      />
      {isBaseLoaded && (
        <Script
          src="https://code.highcharts.com/12.1.2/modules/histogram-bellcurve.js"
          onReady={() => setIsHistogramLoaded(true)}
        />
      )}
    </>
  );
};
