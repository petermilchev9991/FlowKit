import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  required: ['to', 'subject', 'body'],
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    to: { type: 'string' },
    subject: { type: 'string' },
    body: { type: 'string' },
    replyTo: { type: 'string' },
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
      label: 'Email',
      elements: [
        { type: 'VariableText', scope: scope('properties.to'), label: 'To', placeholder: '{{trigger.body.email}}' },
        { type: 'VariableText', scope: scope('properties.subject'), label: 'Subject', placeholder: 'Welcome aboard, {{trigger.body.name}}' },
        { type: 'VariableTextArea', scope: scope('properties.body'), label: 'Message', placeholder: '{{nodes.writer.text}}', minRows: 6 },
        { type: 'VariableText', scope: scope('properties.replyTo'), label: 'Reply-to (optional)', placeholder: 'team@yourcompany.com' },
      ],
    },
  ],
};

export const sendEmailNode: PaletteItem<Schema> = {
  type: 'send-email',
  icon: 'EnvelopeSimple',
  label: 'Send email',
  description: 'Sends an email',
  defaultPropertiesData: {
    label: 'Send email',
    description: 'Sends an email',
    status: 'active',
    to: '',
    subject: '',
    body: '',
    replyTo: '',
  },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      id: { type: 'string', label: 'Email ID', description: 'ID from the email provider' },
      to: { type: 'string', label: 'Sent to', description: 'Recipient address' },
    },
  },
};
