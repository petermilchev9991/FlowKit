import type { NodeSchema, PaletteItem, UISchema } from '@workflowbuilder/sdk';
import { getScope, globalControls, sharedProperties, statusOptions } from '@workflowbuilder/sdk';

const frequencies = [
  { label: 'Every few minutes', value: 'minutes' },
  { label: 'Every hour', value: 'hourly' },
  { label: 'Every day', value: 'daily' },
  { label: 'Every week', value: 'weekly' },
];

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((value) => ({
  label: value.charAt(0).toUpperCase() + value.slice(1),
  value,
}));

const schema = {
  type: 'object',
  properties: {
    ...sharedProperties,
    status: { type: 'string', options: Object.values(statusOptions) },
    frequency: { type: 'string', options: frequencies },
    everyMinutes: { type: 'number' },
    minute: { type: 'number' },
    time: { type: 'string' },
    weekday: { type: 'string', options: weekdays },
    timezone: { type: 'string' },
  },
} satisfies NodeSchema;

type Schema = typeof schema;
const scope = getScope<Schema>;

const showFor = (...values: string[]) => ({
  effect: 'SHOW' as const,
  condition: { scope: scope('properties.frequency'), schema: { enum: values } },
});

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
      label: 'When to run',
      elements: [
        { type: 'Select', scope: scope('properties.frequency'), label: 'Repeat' },
        { type: 'Text', scope: scope('properties.everyMinutes'), label: 'Minutes between runs (5 to 720)', rule: showFor('minutes') },
        { type: 'Text', scope: scope('properties.minute'), label: 'Minute past the hour (0 to 59)', rule: showFor('hourly') },
        { type: 'Select', scope: scope('properties.weekday'), label: 'Day', rule: showFor('weekly') },
        { type: 'Text', scope: scope('properties.time'), label: 'Time (24-hour, HH:MM)', placeholder: '09:00', rule: showFor('daily', 'weekly') },
        {
          type: 'Text',
          scope: scope('properties.timezone'),
          label: 'Time zone',
          placeholder: 'UTC, Europe/London, America/New_York…',
          rule: showFor('hourly', 'daily', 'weekly'),
        },
        {
          type: 'Label',
          text: 'Runs start automatically once the workflow is saved. You can still press Run to test it, and {{trigger.scheduledFor}} holds the planned time.',
        },
      ],
    },
  ],
};

export const scheduleNode: PaletteItem<Schema> = {
  type: 'schedule',
  icon: 'CalendarDots',
  label: 'Schedule',
  description: 'Runs on a timetable',
  isStartNode: true,
  defaultPropertiesData: {
    label: 'Schedule',
    description: 'Every day at 09:00',
    status: 'active',
    frequency: 'daily',
    everyMinutes: 15,
    minute: 0,
    time: '09:00',
    weekday: 'monday',
    timezone: 'UTC',
  },
  schema,
  uischema,
  outputSchema: {
    type: 'default',
    properties: {
      scheduledFor: { type: 'datetime', label: 'Scheduled for', description: 'The planned start time' },
      source: { type: 'string', label: 'Source', description: '"schedule" or "manual"' },
    },
  },
};
