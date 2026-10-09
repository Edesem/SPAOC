import EventsLayout from "@/app/(tabs)/(events)/_layout";
import { render } from "@testing-library/react-native";
import React from "react";

const mockTabStack = jest.fn();
jest.mock("@/components/ui/TabStack", () => ({
  TabStack: (props: object) => {
    mockTabStack(props);
    return null;
  },
}));

beforeEach(() => mockTabStack.mockClear());

describe("tab stacks", () => {
  it("gives Events an empty title and no large title", async () => {
    await render(<EventsLayout />);

    expect(mockTabStack).toHaveBeenCalledWith({ title: "" });
  });
});
