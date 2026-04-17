'use server';
/**
 * @fileOverview ai flows for the flashcard quiz mode.
 * 
 * - generatequiz: creates a balanced quiz using original flashcard questions.
 * - evaluateanswer: semantically evaluates open-ended answers.
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
  prompt: z.string().describe('the original flashcard question text.'),
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
 * generates a full quiz based on the provided flashcards.
 * uses the user's original questions and generates plausible distractors.
 */
export async function generateQuiz(input: z.infer<typeof GenerateQuizInputSchema>): Promise<GenerateQuizOutput> {
  const prompt = ai.definePrompt({
    name: 'generateQuizPrompt',
    input: { schema: GenerateQuizInputSchema },
    output: { schema: GenerateQuizOutputSchema },
    prompt: `you are an expert educator. your task is to generate a comprehensive quiz for the flashcard deck: "{{deckName}}".
    
    for each card provided in the input, create exactly one question.
    
    critical rules:
    1. prompt consistency: for every question, the "prompt" field must be the exact original flashcard question provided in the input. do not rewrite it.
    2. distractors: for 'multiple-choice' and 'image-selection', generate 4 plausible but incorrect distractors. these should be related to the same topic and match the tone of the correct answer. the "options" list must include the correct answer.
    3. image selection: only use 'image-selection' if the card has an 'imageUrl'.
    4. variety: try to provide a mix of 'multiple-choice' and 'open-ended' types across the deck.
    5. strictly lowercase: generate all text content in lowercase.
    
    cards:
    {{#each cards}}
    - id: {{id}}, q: {{question}}, a: {{answer}}, image: {{imageUrl}}
    {{/each}}`,
  });

  try {
    const { output } = await prompt(input);
    if (!output) throw new Error('failed to generate quiz');
    return output;
  } catch (error: any) {
    throw error;
  }
}

const EvaluateAnswerInputSchema = z.object({
  userAnswer: z.string(),
  correctAnswer: z.string(),
  contextQuestion: z.string(),
});

const EvaluateAnswerOutputSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string().describe('a short explanation if incorrect. if correct, keep it very brief like "correct!"'),
  confidence: z.number().min(0).max(1),
});

/**
 * evaluates an open-ended answer semantically.
 */
export async function evaluateAnswer(input: z.infer<typeof EvaluateAnswerInputSchema>): Promise<z.infer<typeof EvaluateAnswerOutputSchema>> {
  const prompt = ai.definePrompt({
    name: 'evaluateAnswerPrompt',
    input: { schema: EvaluateAnswerInputSchema },
    output: { schema: EvaluateAnswerOutputSchema },
    prompt: `you are a helpful tutor evaluating a student's answer.
    
    question: "{{contextQuestion}}"
    correct answer reference: "{{correctAnswer}}"
    student's answer: "{{userAnswer}}"
    
    determine if the student's answer is semantically correct. 
    - be lenient with minor typos or grammatical errors.
    - if the student describes the core concept accurately even with different wording, mark it as correct.
    
    feedback rules:
    - if correct, set feedback to "correct!".
    - if incorrect, provide a very short, helpful explanation of what was missing.
    - strictly lowercase: generate all text content in lowercase.`,
  });

  try {
    const { output } = await prompt(input);
    if (!output) throw new Error('failed to evaluate answer');
    return output;
  } catch (error: any) {
    throw error;
  }
}
