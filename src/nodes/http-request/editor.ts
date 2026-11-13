import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({ label: value, value }));

const schema = {
  type: 'object',
  required: ['url'],
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    method: { type: 'string', options: methods },
    url: { type: 'string' },
    headers: { type: 'string' },
    body: { type: 'string' },
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
      label: 'Request',
      elements: [
        { type: 'Select', scope: scope('properties.method'), label: 'Method' },
        { type: 'VariableText', scope: scope('properties.url'), label: 'URL', placeholder: 'https://api.example.com/items' },
        {
          type: 'VariableTextArea',
          scope: scope('properties.headers'),
          label: 'Headers (one per line)',
          placeholder: 'Authorization: Bearer {{global.apiKey}}',
          minRows: 2,
        },
        {
          type: 'VariableTextArea',
          scope: scope('properties.body'),
          label: 'Body',
          placeholder: '{ "email": "{{trigger.body.email}}" }',
          minRows: 4,
        },
      ],
    },
  ],
};

export const httpRequestNode: PaletteItem<Schema> = {
  type: 'http-request',
  icon: 'Globe',
  label: 'HTTP request',
  description: 'Calls an API',
  defaultPropertiesData: {
    label: 'HTTP request',
    description: 'Calls an API',
    status: 'active',
    method: 'GET',
    url: '',
    headers: '',
    body: '',
  },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      status: { type: 'number', label: 'Status code', description: 'HTTP status, such as 200' },
      ok: { type: 'boolean', label: 'OK', description: 'True for 2xx responses' },
      body: { type: 'object', label: 'Response body', description: 'Parsed JSON, or text' },
    },
  },
};
