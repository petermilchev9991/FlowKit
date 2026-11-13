import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const schema = {
  type: 'object',
  required: ['fields'],
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    fields: { type: 'string' },
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
      label: 'Fields',
      elements: [
        {
          type: 'VariableTextArea',
          scope: scope('properties.fields'),
          label: 'One field per line: name = value',
          placeholder: 'email = {{trigger.body.email}}\ncompany.name = {{nodes.lookup.body.name}}\ngreeting = Hello {{trigger.body.name}}!',
          minRows: 6,
        },
        {
          type: 'Label',
          text: 'Use dots in names to nest (company.name). A value that is a single reference keeps its type, so lists and numbers stay lists and numbers.',
        },
      ],
    },
  ],
};

export const transformNode: PaletteItem<Schema> = {
  type: 'transform',
  icon: 'BracketsCurly',
  label: 'Transform data',
  description: 'Reshapes data for the next block',
  defaultPropertiesData: { label: 'Transform data', description: 'Reshapes data', status: 'active', fields: '' },
  schema,
  uischema,
  outputSchema: { type: 'default', properties: {} },
};
