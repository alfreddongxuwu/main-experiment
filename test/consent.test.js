import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [mainSource, normingSource] = await Promise.all([
  readFile(new URL("../src/main.js", import.meta.url), "utf8"),
  readFile(new URL("../../norming/src/main.js", import.meta.url), "utf8"),
]);

function consentStimulus(source) {
  return source.match(/const consent = \{[\s\S]*?stimulus: `([\s\S]*?)`,\s*choices:/)?.[1];
}

function instructionsStimulus(source) {
  return source.match(/const instructions = \{[\s\S]*?stimulus: `([\s\S]*?)`,\s*choices:/)?.[1];
}

function demographicsPreamble(source) {
  return source.match(/const demographics = \{[\s\S]*?preamble: `([\s\S]*?)`,\s*html:/)?.[1];
}

function demographicsHtml(source) {
  return source.match(/const demographics = \{[\s\S]*?html: `([\s\S]*?)`,\s*button_label:/)?.[1];
}

function demographicsButtonLabel(source) {
  return source.match(/const demographics = \{[\s\S]*?button_label: "([^"]+)"/)?.[1];
}

function asciiQuotes(value) {
  return value
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'");
}

function normalizedHtml(value) {
  return asciiQuotes(value)
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

test("main experiment source uses ASCII quotes on non-rating pages", () => {
  assert.doesNotMatch(mainSource, /[\u2018\u2019\u201c\u201d]/);
});

test("consent text matches the norming consent text except for quote style", () => {
  assert.equal(normalizedHtml(consentStimulus(mainSource)), normalizedHtml(consentStimulus(normingSource)));
});

test("instructions text matches the norming instructions text", () => {
  assert.equal(
    normalizedHtml(instructionsStimulus(mainSource)),
    normalizedHtml(instructionsStimulus(normingSource)),
  );
});

test("demographics page matches the norming demographics page except for quote style", () => {
  assert.equal(
    normalizedHtml(demographicsPreamble(mainSource)),
    normalizedHtml(demographicsPreamble(normingSource)),
  );
  assert.equal(
    normalizedHtml(demographicsHtml(mainSource)),
    normalizedHtml(demographicsHtml(normingSource)),
  );
  assert.equal(demographicsButtonLabel(mainSource), demographicsButtonLabel(normingSource));
});

test("completion page uses the norming completion text", () => {
  assert.match(mainSource, /Thank you for completing this study\. Your response has been recorded\./);
  assert.match(mainSource, /You should be redirected to Prolific automatically\./);
  assert.match(mainSource, /Return to Prolific/);
});
