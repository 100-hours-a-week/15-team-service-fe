/**
 * Common utility functions
 */

// noop
export function noop() {}

// ---- date / time ----
export function formatDate(value) {
  return value;
}

export function formatTime(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---- className helper (shadcn-style) ----
export function cn(...classes) {
  return classes
    .flatMap((c) => {
      if (!c) return [];
      if (Array.isArray(c)) return c;
      if (typeof c === "object") return Object.keys(c).filter((k) => c[k]);
      return String(c).split(" ");
    })
    .filter(Boolean)
    .join(" ");
}

// ---- phone ----
export function formatPhoneNumber(input = "") {
  const digits = String(input).replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export function validatePhoneNumber(input = "") {
  const digits = String(input).replace(/\D/g, "");
  return digits.startsWith("01") && (digits.length === 10 || digits.length === 11);
}

export function getPhoneErrorMessage(input = "") {
  const digits = String(input).replace(/\D/g, "");
  if (!digits) return "전화번호를 입력해주세요.";
  if (!digits.startsWith("01")) return "휴대폰 번호 형식이 올바르지 않습니다.";
  if (digits.length < 10) return "전화번호가 너무 짧습니다.";
  if (digits.length > 11) return "전화번호가 너무 깁니다.";
  return "";
}

// ---- yaml ----
export function parseYAMLToResume(yamlText = "") {
  try {
    const text = String(yamlText);
    const get = (key) => text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1] ?? "";

    return {
      name: get("name"),
      position: get("position"),
      company: get("company"),
      profile: {
        email: get("email"),
        phone: get("phone"),
        github: get("github"),
      },
      education: [],
      experience: [],
      skills: [],
      projects: [],
    };
  } catch {
    return {
      name: "",
      position: "",
      company: "",
      profile: {},
      education: [],
      experience: [],
      skills: [],
      projects: [],
    };
  }
}

// ---- interview list ----
export function extractUniqueCompanies(interviews = []) {
  return [...new Set(interviews.map((i) => i.company).filter(Boolean))];
}

export function sortInterviews(interviews = [], sortOption = "newest") {
  const toTime = (d) => Date.parse(d) || 0;
  return [...interviews].sort((a, b) =>
    sortOption === "oldest"
      ? toTime(a.date) - toTime(b.date)
      : toTime(b.date) - toTime(a.date)
  );
}

export function generatePageNumbers(currentPage = 1, totalPages = 1) {
  return Array.from({ length: totalPages }, (_, i) => i + 1);
}
