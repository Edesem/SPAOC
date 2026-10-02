import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";

export class Haptic {
  // Static method for triggering haptic feedback
  static press(style: ImpactFeedbackStyle = ImpactFeedbackStyle.Rigid) {
    impactAsync(style);
  }
}
