import { Agent } from '@/types/agent';

export const defaultAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Research Agent',
    description: 'Specialized in data analysis and research tasks',
    color: 'hsl(var(--agent-1))',
  },
  {
    id: 'agent-2',
    name: 'Creative Agent',
    description: 'Generates creative content and ideas',
    color: 'hsl(var(--agent-2))',
  },
  {
    id: 'agent-3',
    name: 'Technical Agent',
    description: 'Handles technical queries and coding tasks',
    color: 'hsl(var(--agent-3))',
  },
  {
    id: 'agent-4',
    name: 'Analytics Agent',
    description: 'Provides insights from data patterns',
    color: 'hsl(var(--agent-4))',
  },
  {
    id: 'agent-5',
    name: 'Summary Agent',
    description: 'Condenses information into concise summaries',
    color: 'hsl(var(--agent-5))',
  },
];
