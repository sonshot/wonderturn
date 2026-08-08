import { describe, expect, it } from "vitest";

import { REGISTER_CASES } from "./register-cases";

describe("register case IDs", () => {
  it("are unique and remain in review order", () => {
    expect(REGISTER_CASES.map(({ id }) => id)).toEqual([
      "REG-01",
      "REG-02",
      "REG-03",
      "REG-04",
      "REG-05",
      "REG-06",
      "REG-07",
      "REG-08",
      "REG-09",
      "REG-10",
      "REG-11",
      "REG-12",
      "REG-13",
      "REG-14",
    ]);
  });

  it("defers only cross-sitting memory", () => {
    expect(
      REGISTER_CASES.filter(
        ({ deferredReason }) => deferredReason !== undefined,
      ).map(({ id }) => id),
    ).toEqual(["REG-09"]);
  });
});
