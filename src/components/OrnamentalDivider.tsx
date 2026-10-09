import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Polygon } from "react-native-svg";

type OrnamentalDividerProps = {
  colour: string;
  // Margins come from the caller, which knows what the rule should line up with.
  style?: StyleProp<ViewStyle>;
};

// Side of the lozenge's box, in dp.
const MARK_SIZE = 8;

// A thin rule with a small lozenge at its centre, for marking a break in a
// page. The lozenge is even-sided and small on purpose: the tall diamond is
// CalendarMarker, which says which calendar something belongs to, and this
// must not read as one. The divider is decoration, so screen readers skip it.
const OrnamentalDivider = ({ colour, style }: OrnamentalDividerProps) => {
  const half = MARK_SIZE / 2;
  const points = `${half},0 ${MARK_SIZE},${half} ${half},${MARK_SIZE} 0,${half}`;

  return (
    <View
      testID="ornamental-divider"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.row, style]}
    >
      <View
        testID="ornamental-divider-rule"
        style={[styles.rule, { backgroundColor: colour }]}
      />
      <Svg
        width={MARK_SIZE}
        height={MARK_SIZE}
        viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}
      >
        <Polygon
          testID="ornamental-divider-mark"
          points={points}
          fill={colour}
        />
      </Svg>
      <View
        testID="ornamental-divider-rule"
        style={[styles.rule, { backgroundColor: colour }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rule: {
    flex: 1,
    height: 1,
  },
});

export default OrnamentalDivider;
