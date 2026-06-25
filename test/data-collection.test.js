import test from "node:test";
import assert from "node:assert/strict";
import {
  DATAPIPE_EXPERIMENT_IDS,
  conditionIdFromPipeResult,
  dataFilename,
  dataPipeExperimentIdForItem,
  hasAnyProlificParameter,
  hasDataPipeExperimentForItem,
  isAcceptedSaveResult,
  isCompleteProlificSession,
  prolificParametersFromSearch,
  saveErrorCode,
  submissionIdFromProlificParameters,
} from "../src/data-collection.js";

test("the photo DataPipe experiment ID is configured", () => {
  assert.deepEqual(DATAPIPE_EXPERIMENT_IDS, { photo: "BDqAjcWofskI" });
  assert.equal(dataPipeExperimentIdForItem("photo"), "BDqAjcWofskI");
  assert.equal(hasDataPipeExperimentForItem("photo"), true);
  assert.equal(hasDataPipeExperimentForItem("package"), false);
});

test("Prolific identifiers are read from the standard URL parameters", () => {
  const identifiers = prolificParametersFromSearch(
    "?PROLIFIC_PID=participant-1&STUDY_ID=study-2&SESSION_ID=session-3",
  );

  assert.deepEqual(identifiers, {
    prolificPid: "participant-1",
    studyId: "study-2",
    sessionId: "session-3",
  });
  assert.equal(hasAnyProlificParameter(identifiers), true);
  assert.equal(isCompleteProlificSession(identifiers), true);
});

test("partial and ordinary preview URLs are detected", () => {
  const partial = prolificParametersFromSearch("?PROLIFIC_PID=participant-1");
  const preview = prolificParametersFromSearch("?condition=2");

  assert.equal(hasAnyProlificParameter(partial), true);
  assert.equal(isCompleteProlificSession(partial), false);
  assert.equal(hasAnyProlificParameter(preview), false);
  assert.equal(isCompleteProlificSession(preview), false);
});

test("DataPipe condition results must be valid local item condition IDs", () => {
  assert.equal(conditionIdFromPipeResult(0, 32), 0);
  assert.equal(conditionIdFromPipeResult(31, 32), 31);
  assert.equal(conditionIdFromPipeResult(32, 32), undefined);
  assert.equal(conditionIdFromPipeResult("2", 32), undefined);
  assert.equal(conditionIdFromPipeResult(new Error("offline"), 32), undefined);
});

test("successful, queued, and idempotent saves are accepted", () => {
  assert.equal(isAcceptedSaveResult({ message: "Success" }), true);
  assert.equal(
    isAcceptedSaveResult({
      error: null,
      message: "Data received. OSF upload will be retried automatically.",
    }),
    true,
  );
  assert.equal(
    isAcceptedSaveResult({
      error: "OSF_FILE_EXISTS",
      message: "The OSF file already exists. File names must be unique.",
    }),
    true,
  );
});

test("failed or ambiguous saves are rejected with a safe error code", () => {
  assert.equal(isAcceptedSaveResult({ error: "INVALID_DATA" }), false);
  assert.equal(isAcceptedSaveResult(new Error("offline")), false);
  assert.equal(isAcceptedSaveResult(undefined), false);
  assert.equal(saveErrorCode({ error: "INVALID_DATA" }), "INVALID_DATA");
  assert.equal(saveErrorCode(new Error("offline")), "NETWORK_OR_UNKNOWN_ERROR");
});

test("Prolific submission IDs are deterministic and do not expose raw identifiers", () => {
  const identifiers = {
    prolificPid: "participant-1",
    studyId: "study-2",
    sessionId: "session-3",
  };
  const submissionId = submissionIdFromProlificParameters(identifiers);

  assert.match(submissionId, /^prolific_[0-9a-f]{16}$/);
  assert.equal(submissionId, submissionIdFromProlificParameters(identifiers));
  assert.notEqual(
    submissionId,
    submissionIdFromProlificParameters({ ...identifiers, sessionId: "session-4" }),
  );
  assert.equal(submissionId.includes(identifiers.prolificPid), false);
  assert.equal(submissionId.includes(identifiers.studyId), false);
  assert.equal(submissionId.includes(identifiers.sessionId), false);
  assert.equal(
    submissionIdFromProlificParameters({ ...identifiers, sessionId: "" }),
    undefined,
  );
});

test("the OSF filename includes the item route and anonymized submission ID", () => {
  assert.equal(
    dataFilename("photo", "prolific_1a2b3c4d5e6f7890"),
    "main_photo_prolific_1a2b3c4d5e6f7890.json",
  );
});
