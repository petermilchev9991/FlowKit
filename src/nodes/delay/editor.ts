import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    seconds: { type: 'number' },
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
    { type: 'Text', scope: scope('properties.seconds'), label: 'Wait (seconds, up to 60)' },
  ],
};

export const delayNode: PaletteItem<Schema> = {
  type: 'delay',
  icon: 'Timer',
  label: 'Delay',
  description: 'Waits before continuing',
  defaultPropertiesData: { label: 'Delay', description: 'Waits before continuing', status: 'active', seconds: 5 },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      waitedSeconds: { type: 'number', label: 'Waited', description: 'Seconds waited' },
    },
  },
};
