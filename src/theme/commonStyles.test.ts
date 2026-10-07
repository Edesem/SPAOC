import { getCommonStyles } from "./commonStyles";
import { fontFamily } from "./typography";

describe("getCommonStyles typography", () => {
  const styles = getCommonStyles("light");

  it("sets screen titles in the serif, the liturgical voice", () => {
    expect(styles.title).toMatchObject({
      fontFamily: fontFamily.serif,
      fontSize: 25,
      fontWeight: "700",
    });
  });

  it("sets card titles in the sans", () => {
    expect(styles.sectionTitle).toMatchObject({
      fontFamily: fontFamily.sans,
      fontSize: 25,
      fontWeight: "700",
    });
  });

  it("sets button text in the sans at 700, since the sans has no 600", () => {
    expect(styles.buttonText).toMatchObject({
      fontFamily: fontFamily.sans,
      fontSize: 17,
      fontWeight: "700",
    });
  });

  it("sets detail text in the sans body", () => {
    expect(styles.detailText).toMatchObject({
      fontFamily: fontFamily.sans,
      fontSize: 17,
      fontWeight: "400",
    });
  });
});
