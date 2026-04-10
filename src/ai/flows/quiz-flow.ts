'use server';
/**
 * @fileOverview AI flows for the Flashcard Quiz Mode.
 * 
 * - generateQuiz: Creates a balanced quiz from a set of flashcards.
 * - evaluateAnswer: Semantically evaluates an open-ended answer.
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
  prompt: z.string(),
  options: z.array(z.string()).optional().describe('4-5 options for multiple-choice or image-selection'),
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
 */
export async function generateQuiz(input: z.infer<typeof GenerateQuizInputSchema>): Promise<GenerateQuizOutput> {
  const prompt = ai.definePrompt({
    name: 'generateQuizPrompt',
    input: { schema: GenerateQuizInputSchema },
    output: { schema: GenerateQuizOutputSchema },
    prompt: `You are an expert educator. Your task is to generate a comprehensive quiz for the flashcard deck: "{{deckName}}".
    
    For each card provided in the input, create exactly ONE question. 
    Vary the question types between 'multiple-choice', 'open-ended', and 'image-selection'.
    
    Rules:
    1. For 'multiple-choice': Generate 4 plausible but incorrect distractor options that match the tone and complexity of the correct answer.
    2. For 'image-selection': ONLY use this type if the card has an 'imageUrl'. The question should ask to identify the concept represented by the image.
    3. For 'open-ended': The prompt should be the flashcard's question.
    4. Maintain the original tone and terminology used in the flashcards.
    5. Ensure the quiz is challenging but fair.
    
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
  feedback: z.string().describe('A short, helpful explanation of why it was correct or incorrect.'),
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
    prompt: `You are an AI tutor. A student has provided an answer to an open-ended question.
    
    Question: "{{contextQuestion}}"
    Correct Answer Reference: "{{correctAnswer}}"
    Student's Answer: "{{userAnswer}}"
    
    Determine if the student's answer is semantically correct. 
    - Be lenient with minor typos or grammatical errors.
    - If the student describes the core concept accurately even with different wording, mark it as correct.
    - If they are completely off or missing the key point, mark it as incorrect.
    - Provide a short, encouraging feedback message.`,
  });

  const { output } = await prompt(input);
  if (!output) throw new Error('Failed to evaluate answer');
  return output;
}
