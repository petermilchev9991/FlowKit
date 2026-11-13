import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

export const filterOperators = [
  { label: 'is equal to', value: 'isEqual' },
  { label: 'is not equal to', value: 'isNotEqual' },
  { label: 'contains', value: 'isContaining' },
  { label: 'does not contain', value: 'isNotContaining' },
  { label: 'is greater than', value: 'isGreaterThan' },
  { label: 'is less than', value: 'isLessThan' },
  { label: 'is at least', value: 'isGreaterThanOrEqual' },
  { label: 'is at most', value: 'isLessThanOrEqual' },
  { label: 'is before (date)', value: 'isBefore' },
  { label: 'is after (date)', value: 'isAfter' },
  { label: 'is empty', value: 'isEmpty' },
  { label: 'is not empty', value: 'isNotEmpty' },
];

const schema = {
  type: 'object',
  required: ['value'],
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    value: { type: 'string' },
    operator: { type: 'string', options: filterOperators },
    compareTo: { type: 'string' },
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
      label: 'Continue only if',
      elements: [
        { type: 'VariableText', scope: scope('properties.value'), label: 'Value', placeholder: '{{trigger.body.total}}' },
        { type: 'Select', scope: scope('properties.operator'), label: 'Condition' },
        {
          type: 'VariableText',
          scope: scope('properties.compareTo'),
          label: 'Compared to',
          placeholder: '500',
          rule: { effect: 'HIDE', condition: { scope: scope('properties.operator'), schema: { enum: ['isEmpty', 'isNotEmpty'] } } },
        },
        { type: 'Label', text: 'When the condition is false, the blocks after this one are skipped. The run still counts as a success.' },
      ],
    },
  ],
};

export const filterNode: PaletteItem<Schema> = {
  type: 'filter',
  icon: 'Funnel',
  label: 'Filter',
  description: 'Continues only if a condition is true',
  defaultPropertiesData: {
    label: 'Filter',
    description: 'Continues only if true',
    status: 'active',
    value: '',
    operator: 'isEqual',
    compareTo: '',
  },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: { passed: { type: 'boolean', label: 'Passed', description: 'Whether the condition was true' } },
  },
};
