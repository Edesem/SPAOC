import { useWindowDimensions } from "react-native";

// The widest a column of reading content gets. Phones (up to ~430pt) are
// narrower than this, so they are untouched; iPad and Android tablet windows
// get a centred column instead of rows stretched across the glass.
export const READABLE_MAX_WIDTH = 640;

export const readableGutter = (windowWidth: number): number =>
  Math.max(0, Math.round((windowWidth - READABLE_MAX_WIDTH) / 2));

// Horizontal padding that centres content in a READABLE_MAX_WIDTH column. It
// follows the live window, so rotation, Split View and Android multi-window
// all resolve to the right gutter.
export const useReadableGutter = (): number => {
  const { width } = useWindowDimensions();

  return readableGutter(width);
};
