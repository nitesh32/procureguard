import { adminTools } from './admin';
import { noteTools } from './notes';
import { orderTools } from './orders';
import { readTools } from './reads';
import type { Tool } from './tool';

export const allTools: Tool<any>[] = [...readTools, ...noteTools, ...orderTools, ...adminTools];
