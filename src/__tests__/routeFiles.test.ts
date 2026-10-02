/// <reference types="node" />
import * as fs from "fs";
import * as path from "path";

describe("app directory", () => {
  it("holds no discarded screens, since every file under app/ becomes a route", () => {
    expect(fs.existsSync(path.join(__dirname, "../app/discarded"))).toBe(false);
  });
});
