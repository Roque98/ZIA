import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';

type Props = { size?: number };

/** Símbolo de ZIA Integración, misma geometría que el SVG de la landing. */
export function ZiaMark({ size = 40 }: Props) {
  const clipId = `zia${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="795.5 -21 740 740"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <G fill="#A69140">
        <Rect x={1086.5} y={58} width={26} height={291} rx={13} />
        <Rect x={1086.5} y={349} width={26} height={290} rx={13} />
        <Rect x={1130.5} y={1} width={26} height={348} rx={13} />
        <Rect x={1130.5} y={349} width={26} height={347} rx={13} />
        <Rect x={1174} y={1} width={26} height={348} rx={13} />
        <Rect x={1174} y={349} width={26} height={347} rx={13} />
        <Rect x={1217.5} y={58} width={26} height={291} rx={13} />
        <Rect x={1217.5} y={349} width={26} height={290} rx={13} />
      </G>
      <G fill="#979899">
        <Rect x={873} y={270.5} width={292.5} height={26} rx={13} />
        <Rect x={1165.5} y={270.5} width={292.5} height={26} rx={13} />
        <Rect x={816} y={314.5} width={349.5} height={26} rx={13} />
        <Rect x={1165.5} y={314.5} width={349.5} height={26} rx={13} />
        <Rect x={816} y={358.5} width={349.5} height={26} rx={13} />
        <Rect x={1165.5} y={358.5} width={349.5} height={26} rx={13} />
        <Rect x={873} y={402.5} width={292.5} height={26} rx={13} />
        <Rect x={1165.5} y={402.5} width={292.5} height={26} rx={13} />
      </G>
      <Circle cx={1165.5} cy={349} r={100.5} fill="#000" />
      <Circle cx={1165.5} cy={349} r={112.5} fill="none" stroke="#EC3237" strokeWidth={24} />
      <Defs>
        <ClipPath id={clipId}>
          <Path
            fillRule="evenodd"
            d="M 1165.5 224.5 A 124.5 124.5 0 1 1 1165.49 224.5 Z M 1165.5 248.5 A 100.5 100.5 0 1 0 1165.49 248.5 Z"
          />
        </ClipPath>
      </Defs>
      <G stroke="#000" strokeWidth={16} clipPath={`url(#${clipId})`}>
        <Line x1={1224.3} y1={407.8} x2={1265.8} y2={449.3} />
        <Line x1={1106.7} y1={407.8} x2={1065.2} y2={449.3} />
        <Line x1={1106.7} y1={290.2} x2={1065.2} y2={248.7} />
        <Line x1={1224.3} y1={290.2} x2={1265.8} y2={248.7} />
      </G>
    </Svg>
  );
}
