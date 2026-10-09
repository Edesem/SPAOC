/* eslint-disable @typescript-eslint/no-require-imports */
// A test double for the parts of expo-router's `Stack` the screens use, so a
// screen test can press the native header buttons by their accessibility label
// and read the options a screen sets. Use it inside a jest.mock factory:
//
//   jest.mock("expo-router", () => ({
//     ...require("@/testing/expoRouterStack").createStackMock(),
//     useNavigation: () => ({ setOptions: jest.fn() }),
//   }));
//
// This folder is deliberately outside collectCoverageFrom.
import type { ReactNode } from "react";

type Options = Record<string, unknown>;

export const stackScreenOptions: { current: Options } = { current: {} };

export function createStackMock() {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  function Screen({ options }: { options?: Options }) {
    stackScreenOptions.current = options ?? {};
    return null;
  }

  function Toolbar({
    children,
    placement = "bottom",
  }: {
    children?: ReactNode;
    placement?: string;
  }) {
    return React.createElement(
      View,
      { testID: `toolbar-${placement}` },
      children,
    );
  }

  Toolbar.Button = function ToolbarButton({
    onPress,
    accessibilityLabel,
    hidden,
  }: {
    onPress?: () => void;
    accessibilityLabel?: string;
    hidden?: boolean;
  }) {
    return hidden
      ? null
      : React.createElement(Pressable, {
          accessibilityRole: "button",
          accessibilityLabel,
          onPress,
        });
  };

  Toolbar.Menu = function ToolbarMenu({
    children,
    accessibilityLabel,
    tintColor,
  }: {
    children?: ReactNode;
    accessibilityLabel?: string;
    tintColor?: string;
  }) {
    return React.createElement(
      View,
      { accessibilityLabel, testID: "toolbar-menu", tintColor },
      children,
    );
  };

  Toolbar.MenuAction = function ToolbarMenuAction({
    children,
    isOn,
    onPress,
  }: {
    children?: ReactNode;
    isOn?: boolean;
    onPress?: () => void;
  }) {
    return React.createElement(
      Pressable,
      {
        accessibilityRole: "menuitem",
        accessibilityState: { selected: !!isOn },
        onPress,
      },
      React.createElement(Text, null, children),
    );
  };

  Toolbar.Spacer = function ToolbarSpacer() {
    return null;
  };

  return { Stack: { Screen, Toolbar } };
}
