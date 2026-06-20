import test from "node:test";
import assert from "node:assert/strict";
import { buildParticipantRecord } from "../src/data-record.js";

test("raw jsPsych trials are reduced to one main-experiment preview record", () => {
  const shared = {
    participant_uuid: "123e4567-e89b-12d3-a456-426614174000",
    study: "main-experiment",
    study_version: "main-experiment-preview-1.0.0",
    collection_mode: "preview",
    assignment_source: "local-random-preview",
    local_condition_id: 7,
    global_condition_id: 31,
    item: "package",
    prior: "high",
    qud: "P?",
    utterance_id: "didnt_manage",
    utterance_family: "manage",
    utterance_polarity: "negative",
    is_implicative: true,
    target_utterance: "Catherine didn't manage to pick up the package.",
    completion_question:
      "Given what you have read, how likely is it that Catherine picked up the package?",
    try_question:
      "Given what you have read, how likely is it that Catherine tried to pick up the package?",
    naturalness_question: "How natural does the roommate's answer sound in this context?",
  };

  const record = buildParticipantRecord([
    { ...shared, trial_kind: "consent", consent_given: true, rt: 4100 },
    { ...shared, trial_kind: "instructions", rt: 1800 },
    {
      ...shared,
      trial_kind: "rating",
      rt: 11200,
      completion_rating: 28,
      try_rating: 76,
      naturalness_rating: 82,
      rating_order: ["P?", "TRY?", "NAT"],
    },
    {
      ...shared,
      trial_kind: "demographics",
      rt: 13700,
      response: {
        age: "25",
        gender: "woman",
        education: "bachelor",
        native_language: "english-only",
        country: "united-states",
      },
    },
  ]);

  assert.deepEqual(record, {
    data_schema_version: "main-exp-1.0.0",
    ...shared,
    prolific_pid: null,
    prolific_study_id: null,
    prolific_session_id: null,
    consent_given: true,
    consent_rt_ms: 4100,
    instructions_rt_ms: 1800,
    ratings_rt_ms: 11200,
    rating_order: ["P?", "TRY?", "NAT"],
    completion_rating: 28,
    try_rating: 76,
    naturalness_rating: 82,
    demographics_rt_ms: 13700,
    age: 25,
    gender: "woman",
    education: "bachelor",
    native_language: "english-only",
    country: "united-states",
  });
  assert.equal("condition_id" in record, false);
  assert.equal("prior_context" in record, false);
  assert.equal("qud_context" in record, false);
  assert.equal("answer_frame" in record, false);
  assert.equal("stimulus" in record, false);
});
