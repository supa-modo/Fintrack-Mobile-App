// ─── components/dashboard/SpendingLineChart.tsx ──────────────────────────────
// Drop-in line chart for the Spending Trend section.
// Requires: react-native-svg  →  npx expo install react-native-svg

import React, { useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import { Text } from "../Text";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Circle,
  Text as SvgText,
} from "react-native-svg";

const CHART_HEIGHT = 130;
const PAD_LEFT     = 44;
const PAD_RIGHT    = 12;
const PAD_TOP      = 12;
const PAD_BOTTOM   = 28;
const PLOT_H       = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

function formatCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

interface TrendPoint { month: string; total: number }

export function SpendingLineChart({
  data,
  isDark,
}: {
  data: TrendPoint[];
  isDark: boolean;
}) {
  const [chartWidth, setChartWidth] = useState<number | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== chartWidth) {
      setChartWidth(w);
    }
  };

  const { points, pathD, areaD, maxVal, minVal } = useMemo(() => {
    if (!data.length || !chartWidth) {
      return { points: [], pathD: "", areaD: "", maxVal: 0, minVal: 0 };
    }

    const plotWidth = Math.max(chartWidth - PAD_LEFT - PAD_RIGHT, 0);

    const vals   = data.map((d) => d.total);
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    const range  = maxVal - minVal || 1;

    const points = data.map((d, i) => ({
      x:
        data.length === 1
          ? PAD_LEFT + plotWidth / 2
          : PAD_LEFT + (i / (data.length - 1)) * plotWidth,
      y: PAD_TOP  + (1 - (d.total - minVal) / range) * PLOT_H,
      label: new Date(d.month).toLocaleDateString("en-KE", { month: "short" }),
      value: d.total,
    }));

    // Smooth cubic bezier
    const pathD = points.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1];
      const cpx  = (prev.x + pt.x) / 2;
      return `${acc} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
    }, "");

    const last  = points[points.length - 1];
    const first = points[0];
    const areaD = `${pathD} L ${last.x} ${PAD_TOP + PLOT_H} L ${first.x} ${PAD_TOP + PLOT_H} Z`;

    return { points, pathD, areaD, maxVal, minVal };
  }, [data]);

  const gridColor   = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
  const axisColor   = isDark ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.12)";
  const labelColor  = isDark ? "#475569" : "#94A3B8";
  const dotBorder   = isDark ? "#020B18" : "#F1F5F9";
  const cardBg      = isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF";
  const cardBorder  = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)";

  // Y-axis labels (3 steps)
  const ySteps = [0, 0.5, 1].map((t) => ({
    y:     PAD_TOP + (1 - t) * PLOT_H,
    label: formatCompact(minVal + t * (maxVal - minVal)),
  }));

  return (
    <View
      style={[
        chartStyles.card,
        { backgroundColor: cardBg, borderColor: cardBorder },
        !isDark && chartStyles.cardShadow,
      ]}
      onLayout={handleLayout}
    >
      <Svg width={chartWidth ?? 0} height={CHART_HEIGHT}>
        <Defs>
          <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#3B82F6" stopOpacity={isDark ? 0.28 : 0.18} />
            <Stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {ySteps.map((s, i) => (
          <React.Fragment key={i}>
            <Line
              x1={PAD_LEFT} y1={s.y}
              x2={(chartWidth ?? 0) - PAD_RIGHT} y2={s.y}
              stroke={gridColor}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText
              x={PAD_LEFT - 6} y={s.y + 4}
              textAnchor="end"
              fontSize={9}
              fill={labelColor}
              fontWeight="600"
            >
              {s.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Area fill */}
        {areaD ? (
          <Path d={areaD} fill="url(#areaGrad)" />
        ) : null}

        {/* Line */}
        {pathD ? (
          <Path
            d={pathD}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Dots + X labels */}
        {points.map((pt, i) => (
          <React.Fragment key={i}>
            {/* glow ring */}
            <Circle cx={pt.x} cy={pt.y} r={6} fill="#3B82F6" opacity={0.15} />
            {/* filled dot */}
            <Circle cx={pt.x} cy={pt.y} r={3.5} fill="#3B82F6" />
            {/* white border */}
            <Circle cx={pt.x} cy={pt.y} r={3.5} fill="none" stroke={dotBorder} strokeWidth={1.5} />
            {/* X label */}
            <SvgText
              x={pt.x} y={CHART_HEIGHT - 4}
              textAnchor="middle"
              fontSize={9}
              fill={labelColor}
              fontWeight="600"
            >
              {pt.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardShadow: {
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});