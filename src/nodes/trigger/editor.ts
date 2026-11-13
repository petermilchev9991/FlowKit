import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
  },
} satisfies NodeSchema;

type Schema = typeof schema;
const scope = getScope<Schema>;

const uischema: UISchema = {
  type: 'VerticalLayout',
  elements: [
    ...globalControls,
    { type: 'Text', scope: scope('properties.label'), label: 'Title' },
    { type: 'Text', scope: scope('properties.description'), label: 'Description' },
    {
      type: 'Label',
      text: 'The workflow starts here when you press Run, or when its webhook URL receives a request. Use {{trigger.<field>}} in later blocks to read the data that started it.',
    },
  ],
};

export const triggerNode: PaletteItem<Schema> = {
  type: 'trigger',
  icon: 'Lightning',
  label: 'Trigger',
  description: 'Starts the workflow',
  isStartNode: true,
  defaultPropertiesData: { label: 'Trigger', description: 'Run button or webhook', status: 'active' },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      body: { type: 'object', label: 'Body', description: 'JSON sent to the webhook, or the manual run input' },
      source: { type: 'string', label: 'Source', description: '"manual" or "webhook"' },
      receivedAt: { type: 'datetime', label: 'Received at', description: 'When the run started' },
    },
  },
};
