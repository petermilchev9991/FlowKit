import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  required: ['prompt'],
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    instructions: { type: 'string' },
    prompt: { type: 'string' },
    model: { type: 'string' },
  },
} satisfies NodeSchema;

type Schema = typeof schema;
const scope = getScope<Schema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    {
      type: 'Accordion',
      label: 'General',
      elements: [
        { type: 'Text', scope: scope('properties.label'), label: 'Title' },
        { type: 'Text', scope: scope('properties.description'), label: 'Description' },
        { type: 'Select', scope: scope('properties.status'), label: 'Status' },
      ],
    },
    {
      type: 'Accordion',
      label: 'Prompt',
      elements: [
        {
          type: 'TextArea',
          scope: scope('properties.instructions'),
          label: 'Instructions',
          placeholder: 'You are a support assistant. Answer in two sentences.',
          minRows: 3,
        },
        {
          type: 'VariableTextArea',
          scope: scope('properties.prompt'),
          label: 'Prompt',
          placeholder: 'Summarize this message: {{trigger.body.message}}',
          minRows: 5,
        },
        { type: 'Text', scope: scope('properties.model'), label: 'Model (optional)', placeholder: 'Uses AI_MODEL when empty' },
      ],
    },
  ],
};

export const aiPromptNode: PaletteItem<Schema> = {
  type: 'ai-prompt',
  icon: 'Sparkle',
  label: 'AI prompt',
  description: 'Asks an AI model',
  defaultPropertiesData: {
    label: 'AI prompt',
    description: 'Asks an AI model',
    status: 'active',
    instructions: '',
    prompt: '',
    model: '',
  },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      text: { type: 'string', label: 'Answer', description: 'The model reply' },
      model: { type: 'string', label: 'Model', description: 'Model that answered' },
    },
  },
};
