import { test } from "node:test";
import assert from "node:assert/strict";
import { emailSuggestion, isEmail } from "../src/lib/email";

test("accepts real addresses", () => {
  for (const e of ["grishmakhanal48@gmail.com", "ram.bahadur+orders@yahoo.com", "a@b.co", "info@lights-out.com.np", "  ram@gmail.com  "]) assert.ok(isEmail(e), e);
});

test("refuses half-typed and malformed ones", () => {
  for (const e of ["", "grish", "grish@", "grish@gmail", "@gmail.com", "grish@gmail.", "gr ish@gmail.com", "grish@@gmail.com", "grish..k@gmail.com", ".grish@gmail.com", "grish.@gmail.com", "grish@-gmail.com", "grish@gmail.c"])
    assert.equal(isEmail(e), false, e);
});

test("suggests the common inbox for a near miss", () => {
  assert.equal(emailSuggestion("ram@gmial.com"), "ram@gmail.com");
  assert.equal(emailSuggestion("ram@gmail.con"), "ram@gmail.com");
  assert.equal(emailSuggestion("ram@gmail"), "ram@gmail.com");
  assert.equal(emailSuggestion("ram@yaho.com"), "ram@yahoo.com");
  assert.equal(emailSuggestion("ram@hotmial.com"), "ram@hotmail.com");
  assert.equal(emailSuggestion("ram@gmail.com"), null);
  assert.equal(emailSuggestion("ram@wlink.com.np"), null);
  assert.equal(emailSuggestion("grish"), null);
});
