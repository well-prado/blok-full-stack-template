import AdminDashboardNodes from '@well-prado/blok-admin-dashboard/dist/src/Nodes';
import ApiCall from "@nanoservice-ts/api-call";
import ApiNodes from './nodes/api';
import DatabaseNodes from './nodes/database';
import IfElse from "@nanoservice-ts/if-else";
import type { NodeBase } from "@nanoservice-ts/shared";

const nodes: {
  [key: string]: NodeBase;
} = {
  "@nanoservice-ts/api-call": new ApiCall(),
  "@nanoservice-ts/if-else": new IfElse(),
  
  // API Nodes (includes error node)
  ...ApiNodes,
  
  // Database Nodes (includes mongo-query)
  ...DatabaseNodes,
  
  // Admin Dashboard Nodes
  ...AdminDashboardNodes,
};

export default nodes;
