// Core domain types for the Python Exam Prep AI application.
// All content is sourced from the user-provided syllabus
// ("A Smarter Way to Learn Python" by Mark Myers, Chapters 1–40).
// The first version restricts the course strictly to Chapters 1–40.

export type Difficulty = "Easy" | "Medium" | "Hard";

export type ModuleId = "1";

export interface Module {
  id: ModuleId;
  title: string;
  chapterRange: [number, number];
  description: string;
}

export interface CodeBlock {
  code: string;
  language?: "python" | "text";
  // Optional expected output, used in "predict the output" style content.
  output?: string;
}

export interface Slide {
  id: string;
  title: string;
  kind: "concept" | "syntax" | "example" | "diagram" | "quiz" | "revision";
  body: string; // markdown-ish plain text
  code?: CodeBlock;
  // For quiz slides
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  // For diagram slides — described using a compact pseudo-markup that the
  // UI can render as a styled box diagram.
  diagram?: {
    rows: string[];
  };
}

export interface Flashcard {
  id: string;
  chapter: number;
  // "front" prompt type — concept, syntax, output, mistake
  kind: "concept" | "syntax" | "output" | "mistake";
  front: string;
  back: string;
  // optional code context shown with the front
  code?: string;
}

export interface MCQ {
  id: string;
  chapter: number;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0..3
  explanation: string;
  code?: string;
  output?: string;
  note?: string; // optional misconception / learning note
  // Computed at runtime from the above. Used to label questions in the UI.
  questionType?:
    | "concept"
    | "syntax"
    | "predict-output"
    | "find-error"
    | "choose-code"
    | "data-type"
    | "list-tuple"
    | "conditional"
    | "loop"
    | "dictionary";
}

export interface ChapterPracticeTest {
  questions: Pick<MCQ, "id" | "question" | "options" | "correctIndex" | "explanation" | "code">[];
}

export interface VideoLesson {
  id: string;
  chapter: number;
  title: string;
  durationMinutes: number;
  description: string;
  takeaways: string[];
  youtubeId?: string; // Optional. If absent, show empty state.
}

export interface Chapter {
  number: number;
  module: ModuleId;
  title: string;
  topics: string[];
  learningObjectives: string[];
  simpleExplanation: string[]; // paragraphs
  romanUrduNotes?: string[]; // optional Roman Urdu explanations
  syntax: CodeBlock[];
  examples: {
    description: string;
    code: CodeBlock;
    explanation: string;
  }[];
  commonMistakes: {
    wrong: string;
    correct: string;
    explanation: string;
  }[];
  quickRevision: string[];
  slides: Slide[];
  video?: VideoLesson;
}

export interface CourseContent {
  modules: Module[];
  chapters: Chapter[];
  mcqs: MCQ[];
  flashcards: Flashcard[];
}

// ---------- Progress / persistence types ----------

export interface AttemptedQuestionRecord {
  mcqId: string;
  chapter: number;
  topic: string;
  selected: number; // index selected
  correct: boolean;
  difficulty: Difficulty;
  timestamp: number;
  mode: "topic" | "chapter" | "mixed" | "weak" | "practice" | "exam";
}

export interface ExamResult {
  id: string;
  startedAt: number;
  finishedAt: number;
  durationMinutes: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  chapterPerformance: Record<number, { correct: number; total: number }>;
  weakTopics: string[];
  detailed: {
    mcqId: string;
    chapter: number;
    topic: string;
    selected: number | null;
    correctIndex: number;
    correct: boolean;
    markedForReview: boolean;
  }[];
}

export interface FlashcardProgress {
  // cardId -> "know" | "review"
  [cardId: string]: "know" | "review";
}

export interface ChapterProgress {
  // chapter number -> { completed: boolean; markedAt: number | null }
  [chapterNumber: number]: {
    completed: boolean;
    markedAt: number | null;
    slidesViewed: number; // count
    videosWatched: number;
  };
}

export interface Preferences {
  theme: "light" | "dark" | "system";
  defaultDifficulty: Difficulty | "Mixed";
  examDefaultQuestions: number;
  examDefaultMinutes: number;
  showRomanUrdu: boolean;
}

export interface ProgressState {
  chapters: ChapterProgress;
  flashcards: FlashcardProgress;
  attempts: AttemptedQuestionRecord[];
  exams: ExamResult[];
  preferences: Preferences;
  streak: {
    lastActiveDay: string | null; // YYYY-MM-DD
    current: number;
    longest: number;
  };
  // ISO date strings for each day the user answered at least one question
  activeDays: string[];
  // Optional username (no auth — stored locally only)
  username?: string | null;
}
