import AdminDashboardNodes from '@well-prado/blok-admin-dashboard/dist/src/Nodes';
import ApiCall from "@nanoservice-ts/api-call";
import IfElse from "@nanoservice-ts/if-else";
import type { NodeBase } from "@nanoservice-ts/shared";

const nodes: {
  [key: string]: NodeBase;
} = {
  "@nanoservice-ts/api-call": new ApiCall(),
  "@nanoservice-ts/if-else": new IfElse(),
  
  // Admin Dashboard Nodes
  ...AdminDashboardNodes,
};

export default nodes;
