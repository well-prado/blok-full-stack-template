import * as schema from './schemas';
export declare const db: import("drizzle-orm/libsql").LibSQLDatabase<typeof schema> & {
    $client: import("@libsql/client/.").Client;
};
export declare const rawClient: import("@libsql/client/.").Client;
export declare const dbConfig: {
    path: string;
    mode: string;
    timeout: number;
};
export declare const closeDb: () => void;
export default db;
