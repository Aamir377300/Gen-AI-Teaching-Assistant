// App
export const APP_NAME = "TeachAI";

// Auth
export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_USER_KEY = "auth_user";

// Grade levels
export const GRADE_LEVELS = Array.from({ length: 12 }, (_, i) => ({
  value: `Grade ${i + 1}`,
  label: `Grade ${i + 1}`,
}));

// Curriculum types
export const CURRICULA = [
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "IB", label: "IB" },
  { value: "Cambridge", label: "Cambridge" },
  { value: "State Board", label: "State Board" },
  { value: "Common Core", label: "Common Core" },
];

// Content types
export const CONTENT_TYPES = [
  { value: "notes", label: "📄 Study Notes" },
  { value: "slides", label: "📊 Presentation Slides" },
  { value: "quiz", label: "📝 Quiz (MCQs)" },
];

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// Content lengths
export const CONTENT_LENGTHS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
];

// Tone options
export const TONE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "simple", label: "Simple" },
  { value: "engaging", label: "Engaging" },
];
