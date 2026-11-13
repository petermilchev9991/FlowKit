import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, NodeType, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const conditions = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      x: { type: 'string' },
      comparisonOperator: { type: 'string' },
      y: { type: 'string' },
      logicalOperator: { type: 'string' },
    },
  },
} as const;

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    decisionBranches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sourceHandle: { type: 'string' },
          label: { type: 'string' },
          conditions,
        },
      },
    },
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
      label: 'Branches',
      elements: [
        {
          type: 'Label',
          text: 'Branches are checked top to bottom; the first one that matches continues. Add a last branch with no conditions to catch everything else.',
        },
        { type: 'DecisionBranches', scope: scope('properties.decisionBranches') },
      ],
    },
  ],
};

export const branchNode: PaletteItem<Schema> = {
  type: 'branch',
  icon: 'ArrowsSplit',
  label: 'Branch',
  description: 'Takes a path based on data',
  templateType: NodeType.DecisionNode,
  defaultPropertiesData: { label: 'Branch', description: 'Takes a path based on data', status: 'active', decisionBranches: [] },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      matchedBranch: { type: 'string', label: 'Matched branch', description: 'Name of the branch that was taken' },
    },
  },
};
