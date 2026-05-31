'use server';
/**
 * @fileOverview ai flow for importing grades from blackbaud or other platforms.
 * 
 * - importGrades - extracts course names, codes, and numeric grades from screenshots or text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImportedCourseSchema = z.object({
  name: z.string().describe('the full name of the course.'),
  code: z.string().optional().describe('the academic code (e.g., MATH 101).'),
  grade: z.number().describe('the current percentage (0-100).'),
  letterGrade: z.string().describe('the letter equivalent (e.g., A, B+).'),
  credits: z.number().optional().describe('number of credits/units.'),
});

const ImportGradesInputSchema = z.object({
  fileDataUri: z.string().optional().describe('screenshot of the grades dashboard.'),
  rawText: z.string().optional().describe('copy-pasted grade data.'),
});

const ImportGradesOutputSchema = z.object({
  courses: z.array(ImportedCourseSchema),
  gpa: z.number().optional().describe('calculated gpa if available.'),
});

export type ImportedCourse = z.infer<typeof ImportedCourseSchema>;
export type ImportGradesOutput = z.infer<typeof ImportGradesOutputSchema>;

/**
 * analyzes grade data from an image or raw text and returns structured course objects.
 */
export async function importGrades(input: z.infer<typeof ImportGradesInputSchema>): Promise<ImportGradesOutput> {
  const prompt = ai.definePrompt({
    name: 'importGradesPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: ImportGradesInputSchema },
    output: { schema: ImportGradesOutputSchema },
    prompt: `you are an expert academic data parser. 
    
    task:
    analyze the provided material (either a screenshot of a school grade portal like blackbaud, or raw text pasted from one) and extract all course information.
    
    rules:
    1. identity all courses listed.
    2. for each course, find the name, course code (if visible), current numeric percentage grade, and letter grade.
    3. if a percentage is missing but a letter is present, estimate the percentage based on standard 4.0 scales (A=95, A-=92, B+=88, etc).
    4. return a list of course objects.
    5. strictly lowercase: all text content must be in lowercase.
    
    material:
    {{#if fileDataUri}}
    [screenshot provided as media]
    {{media url=fileDataUri}}
    {{/if}}
    
    {{#if rawText}}
    pasted text:
    {{{rawText}}}
    {{/if}}`,
  });

  try {
    const { output } = await prompt(input);
    if (!output) throw new Error('failed to parse grade data');
    return output;
  } catch (error: any) {
    console.error("import grades error:", error);
    throw error;
  }
}
