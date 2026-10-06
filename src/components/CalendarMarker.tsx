import { View } from "react-native";

type CalendarMarkerProps = {
  colour: string;
  // Side length of the square the diamond is cut from, in dp.
  size?: number;
};

// The mark that says which calendar something belongs to: a diamond (a square
// stood on its point) in the calendar's colour. Event rows, the Settings legend
// and anywhere else a calendar needs a key use this one component, so changing
// the shape here changes it everywhere. The mark is decoration; whatever it sits
// beside names the calendar in text.
const CalendarMarker = ({ colour, size = 14 }: CalendarMarkerProps) => {
  // A rotated square's corners reach size * sqrt(2) across, so the layout box
  // is that wide and the neighbours don't overlap the points.
  const box = Math.ceil(size * Math.SQRT2);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: box,
        height: box,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        testID="calendar-marker"
        style={{
          width: size,
          height: size,
          backgroundColor: colour,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
};

export default CalendarMarker;
