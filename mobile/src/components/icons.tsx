import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { color: string; size?: number };

export function HomeIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StationIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M5 20V9.5L12 6l7 3.5V20" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Rect x={9} y={12} width={6} height={8} rx={1} stroke={color} strokeWidth={1.8} />
      <Path d="M12 12V9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function FolderIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l1.6 2H18.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={15} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M3.5 10h17M8 3.5v3M16 3.5v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="m8.5 15 2.2 2.2 4.3-4.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BackIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5 8 12l7 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PhoneIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 3.5h3L12.5 7 10.8 8.7a12 12 0 0 0 4.5 4.5L17 11.5 20.5 13v3A2 2 0 0 1 18.4 19 16 16 0 0 1 5 5.6 2 2 0 0 1 7 3.5H8Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Dot({ color, size = 8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8">
      <Circle cx={4} cy={4} r={4} fill={color} />
    </Svg>
  );
}
