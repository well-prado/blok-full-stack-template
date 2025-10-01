/**
 * Type-Safe Workflow Query Hook
 * 
 * Enhanced version of the base useWorkflowQuery with full type safety
 * and autocomplete for workflow names based on the backend WorkflowTypeRegistry.
 */

import type { UseQueryResult } from '@tanstack/react-query';
import type { WorkflowTypeRegistry } from '../types/workflow-registry';
import { useWorkflowQuery as useBaseWorkflowQuery } from '@well-prado/blok-react-sdk';

/**
 * Utility type to remove index signatures from a type
 * This ensures only explicitly defined properties are allowed
 */
type KnownKeys<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : symbol extends K
    ? never
    : K]: T[K];
};

/**
 * Extract only the known, explicitly defined properties from input types
 */
type StrictInput<T> = KnownKeys<T>;

/**
 * Options for useWorkflowQuery with strict type checking
 */
interface UseWorkflowQueryOptions<TWorkflowName extends keyof WorkflowTypeRegistry> {
  workflowName: TWorkflowName;
  input?: StrictInput<WorkflowTypeRegistry[TWorkflowName]['input']>;
  params?: Record<string, any>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  retry?: number | boolean;
}

/**
 * Type-safe workflow query hook with autocomplete
 * 
 * @example
 * const query = useWorkflowQuery({
 *   workflowName: 'admin-logs', // ✨ Autocomplete!
 *   input: { page: 1, limit: 10 }, // ✨ Only valid fields shown!
 * });
 * 
 * query.data // ✨ Fully typed as AdminLogsOutput!
 */
export function useWorkflowQuery<TWorkflowName extends keyof WorkflowTypeRegistry>(
  options: UseWorkflowQueryOptions<TWorkflowName>
): UseQueryResult<WorkflowTypeRegistry[TWorkflowName]['output']> {
  return useBaseWorkflowQuery(options as any) as any;
}
