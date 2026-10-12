import { z } from 'zod';
import { nextId } from '../store';
import { defineTool } from './tool';

const entityType = z.enum(['supplier', 'quote', 'order']);

export const addNote = defineTool({
  name: 'add_note',
  description: 'Add a note to a supplier, quote or order.',
  inputSchema: { entityType, entityId: z.string(), text: z.string().min(1) },
  run: ({ entityType, entityId, text }, store) => {
    const note = {
      id: nextId('NOTE', store.data.notes),
      entityType,
      entityId,
      text,
      author: 'agent',
      createdAt: new Date().toISOString(),
    };
    store.data.notes.push(note);
    return note;
  },
});

export const flagForReview = defineTool({
  name: 'flag_for_review',
  description: 'Flag a supplier, quote or order for human review, with the reason.',
  inputSchema: { entityType, entityId: z.string(), reason: z.string().min(1) },
  run: ({ entityType, entityId, reason }, store) => {
    const flag = {
      id: nextId('FLAG', store.data.reviewFlags),
      entityType,
      entityId,
      reason,
      createdAt: new Date().toISOString(),
    };
    store.data.reviewFlags.push(flag);
    return flag;
  },
});

export const noteTools = [addNote, flagForReview];
