'use server';
/**
 * @fileOverview AI flows for the Flashcard Quiz Mode.
 * 
 * - generateQuiz: Creates a balanced quiz using original flashcard questions.
 * - evaluateAnswer: Semantically evaluates open-ended answers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FlashcardSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  imageUrl: z.string().optional().nullable(),
});

const QuizQuestionSchema = z.object({
  cardId: z.string(),
  type: z.enum(['multiple-choice', 'open-ended', 'image-selection']),
  prompt: z.string().describe('The original flashcard question text.'),
  options: z.array(z.string()).optional().describe('4-5 options including the correct answer and distractors'),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
});

const GenerateQuizInputSchema = z.object({
  cards: z.array(FlashcardSchema),
  deckName: z.string(),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

/**
 * Generates a full quiz based on the provided flashcards.
 * Uses the user's original questions and generates plausible distractors.
 */
export async function generateQuiz(input: z.infer<typeof GenerateQuizInputSchema>): Promise<GenerateQuizOutput> {
  const prompt = ai.definePrompt({
    name: 'generateQuizPrompt',
    input: { schema: GenerateQuizInputSchema },
    output: { schema: GenerateQuizOutputSchema },
    prompt: `You are an expert educator. Your task is to generate a comprehensive quiz for the flashcard deck: "{{deckName}}".
    
    For each card provided in the input, create exactly ONE question.
    
    CRITICAL RULES:
    1. PROMPT CONSISTENCY: For EVERY question, the "prompt" field MUST be the exact original flashcard question provided in the input. Do not rewrite it.
    2. DISTRACTORS: For 'multiple-choice' and 'image-selection', generate 4 plausible but incorrect distractors. These should be related to the same topic and match the tone of the correct answer. The "options" list MUST include the correct answer.
    3. IMAGE SELECTION: Only use 'image-selection' if the card has an 'imageUrl'.
    4. VARIETY: Try to provide a mix of 'multiple-choice' and 'open-ended' types across the deck.
    
    Cards:
    {{#each cards}}
    - ID: {{id}}, Q: {{question}}, A: {{answer}}, Image: {{imageUrl}}
    {{/each}}`,
  });

  const { output } = await prompt(input);
  if (!output) throw new Error('Failed to generate quiz');
  return output;
}

const EvaluateAnswerInputSchema = z.object({
  userAnswer: z.string(),
  correctAnswer: z.string(),
  contextQuestion: z.string(),
});

const EvaluateAnswerOutputSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string().describe('A short explanation if incorrect. If correct, keep it very brief like "Correct!"'),
  confidence: z.number().min(0).max(1),
});

/**
 * Evaluates an open-ended answer semantically.
 */
export async function evaluateAnswer(input: z.infer<typeof EvaluateAnswerInputSchema>): Promise<z.infer<typeof EvaluateAnswerOutputSchema>> {
  const prompt = ai.definePrompt({
    name: 'evaluateAnswerPrompt',
    input: { schema: EvaluateAnswerInputSchema },
    output: { schema: EvaluateAnswerOutputSchema },
    prompt: `You are a helpful tutor evaluating a student's answer.
    
    Question: "{{contextQuestion}}"
    Correct Answer Reference: "{{correctAnswer}}"
    Student's Answer: "{{userAnswer}}"
    
    Determine if the student's answer is semantically correct. 
    - Be lenient with minor typos or grammatical errors.
    - If the student describes the core concept accurately even with different wording, mark it as correct.
    
    FEEDBACK RULES:
    - If correct, set feedback to "Correct!".
    - If incorrect, provide a very short, helpful explanation of what was missing.`,
  });

  const { output } = await prompt(input);
  if (!output) throw new Error('Failed to evaluate answer');
  return output;
}
