import { useSettingsStore } from "@/app/settings";

export const useFontStyles = () => {
  const fontSize = useSettingsStore((state) => state.fontSize);

  const base = (() => {
    switch (fontSize) {
      case 'small': return 12;
      case 'medium': return 16
      case 'large': return 24;
      default: return 16;
    }
  })();

  return {
    heading: { fontSize: base + 8, fontWeight: 'bold'},
    subheading: { fontSize: base + 2 },
    body: { fontSize: base },
    small: { fontSize: base - 2 },
  };
};
