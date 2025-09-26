"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDb = exports.dbConfig = exports.rawClient = exports.db = void 0;
const client_1 = require("@libsql/client");
const libsql_1 = require("drizzle-orm/libsql");
const path_1 = __importDefault(require("path"));
const schema = __importStar(require("./schemas"));
// Database file path - will be created in database/ folder
const dbPath = path_1.default.join(__dirname, 'app.db');
// Create LibSQL client
const client = (0, client_1.createClient)({
    url: `file:${dbPath}`,
});
// Create Drizzle database instance
exports.db = (0, libsql_1.drizzle)(client, { schema });
// Export the raw client for direct queries if needed
exports.rawClient = client;
// Database configuration
exports.dbConfig = {
    path: dbPath,
    mode: 'WAL',
    timeout: 5000,
};
// Helper function to close database connection
const closeDb = () => {
    client.close();
};
exports.closeDb = closeDb;
exports.default = exports.db;
//# sourceMappingURL=config.js.map