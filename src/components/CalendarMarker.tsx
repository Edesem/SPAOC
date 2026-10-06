import { View } from "react-native";

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
  // The diamond is a square turned onto its point, then squeezed sideways. Its
  // points reach `height` across, which is the square's diagonal.
  const side = height / Math.SQRT2;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: Math.ceil(height * aspect),
        height: Math.ceil(height),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        testID="calendar-marker"
        style={{
          width: side,
          height: side,
          backgroundColor: colour,
          transform: [{ scaleX: aspect }, { rotate: "45deg" }],
        }}
      />
    </View>
  );
};

export default CalendarMarker;
