import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";

type CalendarMarkerProps = {
  colour: string;
  // Height of the diamond, point to point, in dp.
  height?: number;
  // Width as a share of the height: 1 is an even diamond, lower is lankier.
  aspect?: number;
};

// The mark that says which calendar something belongs to: a tall, narrow
// diamond in the calendar's colour. Event rows, the Settings legend and anywhere
// else a calendar needs a key use this one component, so changing the shape
// here changes it everywhere. The mark is decoration; whatever it sits beside
// names the calendar in text.
const CalendarMarker = ({
  colour,
  height = 22,
  aspect = 0.8,
}: CalendarMarkerProps) => {
  // Whole-dp bounds, so the box lands on the same pixels on every platform.
  const width = Math.ceil(height * aspect);
  const tall = Math.ceil(height);
  // A polygon through the four points rather than a rotated, squeezed square:
  // Android rounds a rotated view's fractional size to pixels and anti-aliases
  // its edges coarsely, which drew a lopsided diamond. SVG draws the same shape
  // on both platforms.
  const points = `${width / 2},0 ${width},${tall / 2} ${width / 2},${tall} 0,${tall / 2}`;

  return (
    <View
      testID="calendar-marker"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: tall }}
    >
      <Svg width={width} height={tall} viewBox={`0 0 ${width} ${tall}`}>
        <Polygon testID="calendar-marker-shape" points={points} fill={colour} />
      </Svg>
    </View>
  );
};

export default CalendarMarker;
