import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  required: ['webhookUrl', 'message'],
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    webhookUrl: { type: 'string' },
    message: { type: 'string' },
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
      label: 'Message',
      elements: [
        {
          type: 'VariableText',
          scope: scope('properties.webhookUrl'),
          label: 'Channel webhook URL',
          placeholder: 'https://hooks.slack.com/services/…',
        },
        {
          type: 'VariableTextArea',
          scope: scope('properties.message'),
          label: 'Message',
          placeholder: 'New order from {{trigger.body.customer}}: {{trigger.body.total}}',
          minRows: 4,
        },
        {
          type: 'Label',
          text: 'Works with Slack and Discord incoming webhooks. Create one in your channel settings and paste its URL here; keep it private.',
        },
      ],
    },
  ],
};

export const chatMessageNode: PaletteItem<Schema> = {
  type: 'chat-message',
  icon: 'ChatCircleText',
  label: 'Chat message',
  description: 'Posts to Slack or Discord',
  defaultPropertiesData: {
    label: 'Chat message',
    description: 'Posts to Slack or Discord',
    status: 'active',
    webhookUrl: '',
    message: '',
  },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      ok: { type: 'boolean', label: 'Posted', description: 'Whether the message was accepted' },
      service: { type: 'string', label: 'Service', description: 'slack, discord or other' },
    },
  },
};
