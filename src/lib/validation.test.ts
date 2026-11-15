import { fieldErrors, postSchema, signupSchema } from "./validation";

describe("validation", () => {
  it("normalizes email and accepts a valid signup", () => {
    const parsed = signupSchema.parse({
      name: "Ada",
      email: "  ADA@Example.com ",
      password: "longenough",
    });
    expect(parsed.email).toBe("ada@example.com");
  });

  it("collects one message per field", () => {
    const result = postSchema.safeParse({ title: "no", body: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({
        title: expect.stringContaining("at least 4"),
        body: expect.stringContaining("at least 10"),
      });
    }
  });
});
