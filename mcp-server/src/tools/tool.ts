import type { z, ZodRawShape } from 'zod';
import type { Store } from '../store';

export type Tool<Shape extends ZodRawShape = ZodRawShape> = {
  name: string;
  description: string;
  inputSchema: Shape;
  run: (args: z.infer<z.ZodObject<Shape>>, store: Store) => unknown;
};

/** Bad input from the model. Returned to the model as a readable tool error. */
export class ToolInputError extends Error {}

export function defineTool<Shape extends ZodRawShape>(tool: Tool<Shape>): Tool<Shape> {
  return tool;
}

export function requireRecord<T>(record: T | undefined, notFoundMessage: string): T {
  if (record === undefined) throw new ToolInputError(notFoundMessage);
  return record;
}
