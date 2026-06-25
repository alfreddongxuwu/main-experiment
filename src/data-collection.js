export const DATAPIPE_EXPERIMENT_IDS = Object.freeze({
  photo: "BDqAjcWofskI",
});

export const PROLIFIC_PARAMETER_NAMES = Object.freeze([
  "PROLIFIC_PID",
  "STUDY_ID",
  "SESSION_ID",
]);

const FNV_OFFSET_BASIS_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;
const FNV_64_MASK = 0xffffffffffffffffn;

const ACCEPTED_SAVE_MESSAGES = new Set([
  "Success",
  "Data received. OSF upload will be retried automatically.",
]);

export function dataPipeExperimentIdForItem(itemRoute) {
  return DATAPIPE_EXPERIMENT_IDS[itemRoute];
}

export function hasDataPipeExperimentForItem(itemRoute) {
  return Boolean(dataPipeExperimentIdForItem(itemRoute));
}

export function prolificParametersFromSearch(search) {
  const query = search instanceof URLSearchParams ? search : new URLSearchParams(search);

  return {
    prolificPid: query.get("PROLIFIC_PID")?.trim() ?? "",
    studyId: query.get("STUDY_ID")?.trim() ?? "",
    sessionId: query.get("SESSION_ID")?.trim() ?? "",
  };
}

export function hasAnyProlificParameter(parameters) {
  return Object.values(parameters).some((value) => value !== "");
}

export function isCompleteProlificSession(parameters) {
  return Object.values(parameters).every((value) => value !== "");
}

export function submissionIdFromProlificParameters(parameters) {
  if (!isCompleteProlificSession(parameters)) {
    return undefined;
  }

  const submissionKey = [
    parameters.prolificPid,
    parameters.studyId,
    parameters.sessionId,
  ].join("");

  return `prolific_${fnv1a64(submissionKey)}`;
}

export function conditionIdFromPipeResult(result, conditionCount) {
  return Number.isInteger(result) && result >= 0 && result < conditionCount
    ? result
    : undefined;
}

export function isAcceptedSaveResult(result) {
  if (!result || typeof result !== "object") {
    return false;
  }

  if (result.error === "OSF_FILE_EXISTS") {
    return true;
  }

  return result.error == null && ACCEPTED_SAVE_MESSAGES.has(result.message);
}

export function saveErrorCode(result) {
  return typeof result?.error === "string" ? result.error : "NETWORK_OR_UNKNOWN_ERROR";
}

export function dataFilename(itemRoute, submissionId) {
  return `main_${itemRoute}_${submissionId}.json`;
}

function fnv1a64(value) {
  let hash = FNV_OFFSET_BASIS_64;

  for (const character of value) {
    hash ^= BigInt(character.codePointAt(0));
    hash = (hash * FNV_PRIME_64) & FNV_64_MASK;
  }

  return hash.toString(16).padStart(16, "0");
}
