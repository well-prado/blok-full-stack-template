import MongoQuery from "./mongodb-query";

// Database Operation Nodes
export { default as UserFind } from "./user-find";
export { default as UserList } from "./user-list";
export { default as UserUpdate } from "./user-update";
export { default as UserDelete } from "./user-delete";

const DatabaseNodes = {
  "mongo-query": new MongoQuery(),
};

export default DatabaseNodes;
