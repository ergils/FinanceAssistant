import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getConfirmationAction } from "./confirmation.ts";

Deno.test("jawaban YA mengonfirmasi", () => {
  assertEquals(getConfirmationAction("YA"), "confirm");
});

Deno.test("jawaban BATAL membatalkan", () => {
  assertEquals(getConfirmationAction("BATAL"), "cancel");
});

Deno.test("spasi dan huruf kecil tetap dikenali", () => {
  assertEquals(getConfirmationAction(" ya "), "confirm");
});

Deno.test("jawaban lain diabaikan", () => {
  assertEquals(getConfirmationAction("mungkin"), "ignore");
});
