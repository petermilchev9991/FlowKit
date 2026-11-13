import type { PaletteItemOrGroup } from '@workflowbuilder/sdk';

import { aiPromptNode } from './ai-prompt/editor';
import { branchNode } from './branch/editor';
import { chatMessageNode } from './chat-message/editor';
import { delayNode } from './delay/editor';
import { filterNode } from './filter/editor';
import { httpRequestNode } from './http-request/editor';
import { scheduleNode } from './schedule/editor';
import { sendEmailNode } from './send-email/editor';
import { transformNode } from './transform/editor';
import { triggerNode } from './trigger/editor';

/**
 * Blocks shown in the editor palette, in groups. To add a block, create a
 * folder next to these with an editor.ts and an executor.ts, then register it
 * here and in ./executors.ts. Must stay a module-level constant (stable reference).
 */
export const paletteItems: PaletteItemOrGroup[] = [
  { label: 'Start', isOpen: true, groupItems: [triggerNode, scheduleNode] },
  { label: 'Actions', isOpen: true, groupItems: [httpRequestNode, sendEmailNode, chatMessageNode, aiPromptNode] },
  { label: 'Logic', isOpen: true, groupItems: [branchNode, filterNode, transformNode, delayNode] },
];
