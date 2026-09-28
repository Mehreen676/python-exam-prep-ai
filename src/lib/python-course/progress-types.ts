// Re-export the types from types.ts so the store and components can import
// everything from one place. We keep them in a separate file to avoid
// circular imports.
export type {
  AttemptedQuestionRecord,
  Chapter,
  ChapterPracticeTest,
  ChapterProgress,
  CodeBlock,
  CourseContent,
  Difficulty,
  ExamResult,
  Flashcard,
  FlashcardProgress,
  MCQ,
  Module,
  ModuleId,
  Preferences,
  ProgressState,
  Slide,
  VideoLesson,
} from './types';
