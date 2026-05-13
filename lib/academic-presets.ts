export const CLASS_PRESETS = Array.from({ length: 12 }, (_, index) => {
  const grade = String(index + 1);
  return {
    grade,
    name: `Class ${grade}`,
  };
});

export const SECTION_PRESETS = ["A", "B", "C", "D", "E", "F", "Morning", "Day", "Science", "Commerce", "Arts"];

export const ACADEMIC_YEAR_PRESETS = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() + index));

export const SUBJECT_PRESETS = [
  { name: "Bangla", code: "BAN", type: "core" },
  { name: "English", code: "ENG", type: "core" },
  { name: "Mathematics", code: "MATH", type: "core" },
  { name: "General Science", code: "GSC", type: "core" },
  { name: "Bangladesh and Global Studies", code: "BGS", type: "core" },
  { name: "Religion and Moral Education", code: "RME", type: "core" },
  { name: "Information and Communication Technology", code: "ICT", type: "core" },
  { name: "Physical Education and Health", code: "PEH", type: "core" },
  { name: "Arts and Crafts", code: "ART", type: "optional" },
  { name: "Agriculture Studies", code: "AGR", type: "optional" },
  { name: "Home Science", code: "HSC", type: "optional" },
  { name: "Physics", code: "PHY", type: "elective" },
  { name: "Chemistry", code: "CHEM", type: "elective" },
  { name: "Biology", code: "BIO", type: "elective" },
  { name: "Higher Mathematics", code: "HMATH", type: "elective" },
  { name: "Accounting", code: "ACC", type: "elective" },
  { name: "Finance and Banking", code: "FIN", type: "elective" },
  { name: "Business Entrepreneurship", code: "BENT", type: "elective" },
  { name: "Economics", code: "ECO", type: "elective" },
  { name: "Civics", code: "CIV", type: "elective" },
  { name: "History", code: "HIS", type: "elective" },
  { name: "Geography", code: "GEO", type: "elective" },
] as const;

export type SubjectPreset = (typeof SUBJECT_PRESETS)[number];
