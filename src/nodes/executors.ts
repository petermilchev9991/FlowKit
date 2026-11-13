import type { NodeExecutor } from '@/engine/types';

import { executeAiPrompt } from './ai-prompt/executor';
import { executeBranch } from './branch/executor';
import { executeChatMessage } from './chat-message/executor';
import { executeDelay } from './delay/executor';
import { executeFilter } from './filter/executor';
import { executeHttpRequest } from './http-request/executor';
import { executeSchedule } from './schedule/executor';
import { executeSendEmail } from './send-email/executor';
import { executeTransform } from './transform/executor';
import { executeTrigger } from './trigger/executor';

/**
 * Server-side code for each block, keyed by the `type` used in editor.ts.
 * Register new blocks here as well as in ./editor.ts.
 */
export const executors: Record<string, NodeExecutor<never>> = {
  trigger: executeTrigger,
  schedule: executeSchedule,
  'http-request': executeHttpRequest,
  'send-email': executeSendEmail,
  'chat-message': executeChatMessage,
  'ai-prompt': executeAiPrompt,
  branch: executeBranch,
  filter: executeFilter,
  transform: executeTransform,
  delay: executeDelay,
};
