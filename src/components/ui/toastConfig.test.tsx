import { fontFamily } from "@/theme/typography";
import { render } from "@testing-library/react-native";
import { toastConfig } from "./toastConfig";

describe("toastConfig typography", () => {
  it("sets a success toast's message in the sans", async () => {
    const { success } = toastConfig("light");

    const { getByText } = await render(success({ text1: "Account Number copied" }));

    expect(getByText("Account Number copied")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 15,
    });
  });

  it("sets an error toast's message in the sans", async () => {
    const { error } = toastConfig("dark");

    const { getByText } = await render(error({ text1: "Could not copy" }));

    expect(getByText("Could not copy")).toHaveStyle({
      fontFamily: fontFamily.sans,
    });
  });
});
