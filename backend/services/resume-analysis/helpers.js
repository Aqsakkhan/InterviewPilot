/* ── Helpers ── */

function lower(v) {
  return String(v || "").toLowerCase();
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function round1(v) {
  return Math.round(v * 10) / 10;
}

/** Single large lowercase haystack to search across all resume text. */
function buildHaystack({ skills, projects, experience, rawText }) {
  return lower(
    [
      ...(skills || []),
      ...(projects || []).flatMap((p) => [
        p.name,
        p.description,
        ...(p.techStack || []),
      ]),
      ...(experience || []).flatMap((e) => [e.role, e.company, e.description]),
      rawText || "",
    ]
      .filter(Boolean)
      .join(" \n "),
  );
}

/**
 * Word-boundary regex match.
 * Prevents short keywords ("go","r","c") from false-positiving inside
 * longer words ("mongodb","express","react").
 */
function escapeRegex(v) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function kwMatch(haystack, keyword) {
  return new RegExp(`\\b${escapeRegex(keyword.trim())}\\b`, "i").test(haystack);
}
module.exports = {
  lower,
  clamp,
  round1,
  buildHaystack,
  escapeRegex,
  kwMatch,
};
