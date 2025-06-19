'use server';

/**
 * @fileOverview Provides AI-powered suggestions for invoice line items or descriptions.
 *
 * - suggestInvoiceItems - A function that suggests invoice items based on previous entries.
 * - SuggestInvoiceItemsInput - The input type for the suggestInvoiceItems function.
 * - SuggestInvoiceItemsOutput - The return type for the suggestInvoiceItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestInvoiceItemsInputSchema = z.object({
  previousEntries: z
    .array(z.string())
    .describe('An array of previous invoice line items or descriptions.'),
  currentInput: z
    .string()
    .describe('The current input from the user, which may be incomplete.'),
});
export type SuggestInvoiceItemsInput = z.infer<typeof SuggestInvoiceItemsInputSchema>;

const SuggestInvoiceItemsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested invoice line items or descriptions.'),
});
export type SuggestInvoiceItemsOutput = z.infer<typeof SuggestInvoiceItemsOutputSchema>;

export async function suggestInvoiceItems(input: SuggestInvoiceItemsInput): Promise<SuggestInvoiceItemsOutput> {
  return suggestInvoiceItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInvoiceItemsPrompt',
  input: {schema: SuggestInvoiceItemsInputSchema},
  output: {schema: SuggestInvoiceItemsOutputSchema},
  prompt: `You are an invoicing assistant.  Based on the user\'s previous invoice entries and their current input, suggest relevant invoice line items or descriptions to help them quickly create invoices.

Previous entries:
{{#each previousEntries}}
- {{{this}}}
{{/each}}

Current Input: {{{currentInput}}}

Suggestions:`,
});

const suggestInvoiceItemsFlow = ai.defineFlow(
  {
    name: 'suggestInvoiceItemsFlow',
    inputSchema: SuggestInvoiceItemsInputSchema,
    outputSchema: SuggestInvoiceItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
