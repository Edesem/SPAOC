import { typography } from "@/theme/typography";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type TextLayoutEvent,
  type TextStyle,
} from "react-native";

const CAP_LINES = 2;
const CAP_WIDTH = 40;

type Props = {
  text: string;
  textStyle: TextStyle;
  capColour?: string;
  textColour?: string;
  selectable?: boolean;
};

type Split = { forText: string; head: string; tail: string };

// Text with a drop cap: the first letter is set large beside the first two
// lines, and the rest wraps beneath at full width. React Native cannot flow
// text around a float, so the lines are measured once and split.
export default function DropCapText({
  text,
  textStyle,
  capColour,
  textColour,
  selectable,
}: Props): JSX.Element | null {
  const [split, setSplit] = useState<Split | null>(null);

  if (!text) return null;

  const cap = text[0];
  const rest = text.slice(1);
  const current = split?.forText === rest ? split : null;
  const bodyStyle = [textStyle, { color: textColour }];

  // Until the lines are known the whole text sits beside the letter. The
  // measuring pass runs in this layout, so its width is the real one.
  const onTextLayout = ({ nativeEvent }: TextLayoutEvent) => {
    if (current) return;
    const { lines } = nativeEvent;
    const head = lines
      .slice(0, CAP_LINES)
      .map((line) => line.text)
      .join("");
    setSplit({ forText: rest, head, tail: rest.slice(head.length) });
  };

  return (
    <View accessible accessibilityLabel={text}>
      <View style={styles.row}>
        <Text
          testID="drop-cap"
          style={[styles.cap, typography.dropCap, { color: capColour }]}
        >
          {cap}
        </Text>
        <Text
          testID={current ? "drop-cap-head" : "drop-cap-measure"}
          style={[styles.head, bodyStyle]}
          selectable={selectable}
          onTextLayout={onTextLayout}
        >
          {current ? current.head : rest}
        </Text>
      </View>
      {current?.tail ? (
        <Text testID="drop-cap-tail" style={bodyStyle} selectable={selectable}>
          {current.tail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  cap: { width: CAP_WIDTH },
  head: { flex: 1 },
});
