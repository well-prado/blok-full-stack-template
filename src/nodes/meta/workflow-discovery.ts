import { type INanoServiceResponse, NanoService, NanoServiceResponse, type ParamsDictionary, type JsonLikeObject } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

interface WorkflowDiscoveryInput {
  includeSchemas?: boolean;
  filterByRole?: boolean;
}

interface WorkflowSchema {
  key: string;
  name: string;
  version: string;
  description: string;
  path: string;
  methods: string[];
  authRequired: boolean;
  roles: string[];
  inputSchema?: any;
  outputSchema?: any;
  parameters?: {
    path?: Record<string, any>;
    query?: Record<string, any>;
  };
}

interface WorkflowDiscoveryResponse {
  workflows: WorkflowSchema[];
  totalCount: number;
  userRole: string;
  timestamp: string;
  version: string;
}

export default class WorkflowDiscovery extends NanoService<WorkflowDiscoveryInput> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        includeSchemas: {
          type: "boolean",
          default: true,
          description: "Include JSON schemas for input/output validation"
        },
        filterByRole: {
          type: "boolean",
          default: true,
          description: "Filter workflows based on user role"
        }
      }
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        workflows: {
          type: "array",
          description: "Array of discovered workflow schemas",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
                description: "Unique workflow identifier"
              },
              name: {
                type: "string", 
                description: "Human-readable workflow name"
              },
              version: {
                type: "string",
                description: "Workflow version"
              },
              description: {
                type: "string",
                description: "Workflow description"
              },
              path: {
                type: "string",
                description: "API endpoint path"
              },
              methods: {
                type: "array",
                description: "Supported HTTP methods",
                items: {
                  type: "string",
                  enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "ANY"]
                }
              },
              authRequired: {
                type: "boolean",
                description: "Whether authentication is required"
              },
              roles: {
                type: "array",
                description: "Required user roles",
                items: {
                  type: "string"
                }
              },
              inputSchema: {
                type: "object",
                description: "JSON Schema for input validation",
                additionalProperties: true
              },
              outputSchema: {
                type: "object", 
                description: "JSON Schema for output validation",
                additionalProperties: true
              },
              parameters: {
                type: "object",
                description: "URL and query parameter schemas",
                properties: {
                  path: {
                    type: "object",
                    description: "Path parameter schemas",
                    additionalProperties: {
                      type: "object"
                    }
                  },
                  query: {
                    type: "object", 
                    description: "Query parameter schemas",
                    additionalProperties: {
                      type: "object"
                    }
                  }
                }
              }
            },
            required: ["key", "name", "version", "description", "path", "methods", "authRequired", "roles"]
          }
        },
        totalCount: {
          type: "number",
          description: "Total number of discovered workflows",
          minimum: 0
        },
        userRole: {
          type: "string",
          description: "Current user's role",
          enum: ["guest", "user", "admin"]
        },
        timestamp: {
          type: "string",
          format: "date-time",
          description: "Discovery timestamp in ISO format"
        },
        version: {
          type: "string",
          description: "Workflow discovery API version"
        }
      },
      required: ["workflows", "totalCount", "userRole", "timestamp", "version"]
    };
  }

  async handle(ctx: Context, inputs: WorkflowDiscoveryInput): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Get user role for filtering
      const userRole = ctx.vars?.user?.role || 'guest';
      const isAuthenticated = Boolean(ctx.vars?.isAuthenticated);


      // Discover all workflows
      const workflows = await this.discoverWorkflows({
        userRole,
        isAuthenticated,
        includeSchemas: inputs.includeSchemas ?? true,
        filterByRole: inputs.filterByRole ?? true
      });

      const discoveryResponse: WorkflowDiscoveryResponse = {
        workflows,
        totalCount: workflows.length,
        userRole,
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      };

      // Store in context for potential chaining
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.workflowDiscovery = discoveryResponse as unknown as ParamsDictionary;

      response.setSuccess(discoveryResponse as unknown as JsonLikeObject);
      
    } catch (error: unknown) {
      console.error("[WorkflowDiscovery] Error:", error);
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Failed to discover workflows"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
    }

    return response;
  }

  private async discoverWorkflows(options: {
    userRole: string;
    isAuthenticated: boolean;
    includeSchemas: boolean;
    filterByRole: boolean;
  }): Promise<WorkflowSchema[]> {
    const workflows: WorkflowSchema[] = [];

    try {
      // Import the registered workflows directly using require for compiled code  
      const path = require('path');
      const fs = require('fs');
      
      // Try multiple possible paths for the Workflows.js file
      const possiblePaths = [
        path.resolve(__dirname, '../../Workflows.js'),  // From compiled dist location
        path.resolve(process.cwd(), 'dist/src/Workflows.js'),  // Absolute from project root
        path.resolve(process.cwd(), 'src/Workflows.js')  // Fallback to source
      ];
      
      let workflowsPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          workflowsPath = testPath;
          break;
        }
      }
      
      if (!workflowsPath) {
        throw new Error(`Workflows file not found. Tried: ${possiblePaths.join(', ')}`);
      }
      
      
      delete require.cache[workflowsPath]; // Clear cache to get fresh data
      const workflowsModule = require(workflowsPath);
      const workflowMap = workflowsModule.default || workflowsModule;
      

      for (const [workflowKey, workflowDefinition] of Object.entries(workflowMap)) {
        try {
          const workflowSchema = await this.analyzeWorkflowDefinition(workflowKey, workflowDefinition as any, options);
          if (workflowSchema) {
            workflows.push(workflowSchema);
          } else {
          }
        } catch (error) {
          console.warn(`[WorkflowDiscovery] Failed to analyze workflow: ${workflowKey}`, error);
        }
      }

      
      // Filter by role if requested
      if (options.filterByRole) {
        const filtered = workflows.filter(workflow => this.canUserAccessWorkflow(workflow, options.userRole, options.isAuthenticated));
        return filtered;
      }

      return workflows;
    } catch (error) {
      console.error("[WorkflowDiscovery] Error discovering workflows:", error);
      throw error;
    }
  }


  private async analyzeWorkflowDefinition(workflowKey: string, workflowDefinition: any, options: any): Promise<WorkflowSchema | null> {
    try {
      // Extract workflow metadata from the workflow definition object
      const config = workflowDefinition._config || {};
      const workflowName = config.name || workflowKey;
      const workflowVersion = config.version || "1.0.0";
      const workflowDescription = config.description || `${workflowName} workflow`;
      
      // Extract HTTP trigger information
      const httpTrigger = this.extractHttpTriggerFromDefinition(workflowDefinition);
      
      if (!httpTrigger) {
        return null; // Not a valid HTTP workflow
      }

      // Determine auth requirements and roles based on workflow key and definition
      const authInfo = this.analyzeAuthRequirementsFromKey(workflowKey, workflowDefinition);
      
      // Convert trigger path to API path (add /api prefix if not present)
      let apiPath = httpTrigger.path;
      if (apiPath === "/") {
        apiPath = `/api/${workflowKey}`;
      } else if (!apiPath.startsWith("/api/")) {
        apiPath = `/api${apiPath}`;
      }
      
      const schema: WorkflowSchema = {
        key: workflowKey,
        name: workflowName,
        version: workflowVersion,
        description: workflowDescription,
        path: apiPath,
        methods: Array.isArray(httpTrigger.method) ? httpTrigger.method : [httpTrigger.method],
        authRequired: authInfo.required,
        roles: authInfo.roles,
      };

      // Include schemas if requested
      if (options.includeSchemas) {
        schema.inputSchema = this.generateInputSchemaFromKey(workflowKey);
        schema.outputSchema = this.generateOutputSchema(workflowKey);
        schema.parameters = this.extractParameters(apiPath);
      }

      return schema;
    } catch (error) {
      console.warn(`[WorkflowDiscovery] Error analyzing workflow ${workflowKey}:`, error);
      return null;
    }
  }






  private extractHttpTriggerFromDefinition(workflowDefinition: any): { method: string; path: string } | null {
    try {
      // Access the workflow configuration
      const config = workflowDefinition._config;
      if (!config) {
        return null;
      }

      // Look for HTTP triggers in the configuration
      const triggers = config.triggers;
      if (triggers && Array.isArray(triggers)) {
        const httpTrigger = triggers.find((trigger: any) => trigger.type === 'http');
        if (httpTrigger) {
          return {
            method: httpTrigger.method || 'GET',
            path: httpTrigger.path || '/'
          };
        }
      }

      // Fallback: assume it's an HTTP workflow with basic settings
      // Most Blok workflows are HTTP workflows by default
      return {
        method: 'ANY',
        path: '/'
      };
    } catch (error) {
      console.warn(`[WorkflowDiscovery] Error extracting HTTP trigger:`, error);
      return null;
    }
  }

  private analyzeAuthRequirementsFromKey(workflowKey: string, workflowDefinition: any): { required: boolean; roles: string[] } {
    // Determine auth requirements based on workflow key patterns
    const key = workflowKey.toLowerCase();
    
    // Admin workflows require admin role
    if (key.includes('admin') || key.includes('user-management') || key.includes('user-role') || key.includes('audit')) {
      return {
        required: true,
        roles: ['admin']
      };
    }
    
    // Authentication workflows (except registration) require auth
    if (key.startsWith('auth-') && !key.includes('register')) {
      return {
        required: true,
        roles: ['user', 'admin']
      };
    }
    
    // Profile workflows require auth
    if (key.includes('profile') || key.includes('notification') || key.includes('theme-preferences')) {
      return {
        required: true,
        roles: ['user', 'admin']
      };
    }
    
    // Security workflows require auth
    if (key.includes('two-factor') || key.includes('password-reset')) {
      return {
        required: true,
        roles: ['user', 'admin']
      };
    }
    
    // Email workflows (except verification) might require admin
    if (key.includes('email-service')) {
      return {
        required: true,
        roles: ['admin']
      };
    }
    
    // Test workflows and public endpoints
    if (key.includes('test') || key.includes('countries') || key.includes('empty') || key.includes('register') || key.includes('verification') || key.includes('discovery')) {
      return {
        required: false,
        roles: ['guest', 'user', 'admin']
      };
    }
    
    // Default: require authentication but allow discovery for development
    return {
      required: false, // Make all workflows discoverable for SDK generation
      roles: ['guest', 'user', 'admin']
    };
  }

  private generateInputSchemaFromKey(workflowKey: string): any {
    const key = workflowKey.toLowerCase();
    
    // Generate schemas based on workflow type
    if (key.includes('login')) {
      return {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
          sessionDurationHours: { type: "number", default: 1 }
        },
        required: ["email", "password"],
        additionalProperties: false
      };
    }
    
    if (key.includes('register')) {
      return {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string", minLength: 1 },
          role: { type: "string", enum: ["user", "admin"], default: "user" }
        },
        required: ["email", "password", "name"],
        additionalProperties: false
      };
    }
    
    if (key.includes('profile')) {
      return {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          currentPassword: { type: "string" },
          newPassword: { type: "string", minLength: 8 },
          profileImage: { type: "string" },
          preferences: { type: "object" }
        },
        additionalProperties: false
      };
    }
    
    if (key.includes('user-management') || key.includes('admin')) {
      return {
        type: "object",
        properties: {
          page: { type: "number", minimum: 1, default: 1 },
          limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
          search: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
          sortBy: { type: "string", default: "createdAt" },
          sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" }
        },
        additionalProperties: false
      };
    }
    
    // Default schema
    return {
      type: "object",
      properties: {},
      additionalProperties: true
    };
  }

  private generateOutputSchema(workflowKey: string): any {
    // Special case: return our own detailed output schema for workflow-discovery
    if (workflowKey === 'workflow-discovery') {
      return this.outputSchema;
    }
    
    try {
      // Import the registered nodes to get their actual output schemas
      const path = require('path');
      const fs = require('fs');
      
      // Try to find the compiled Nodes.js file
      const possiblePaths = [
        path.resolve(__dirname, '../../Nodes.js'),
        path.resolve(process.cwd(), 'dist/src/Nodes.js'),
        path.resolve(process.cwd(), 'src/Nodes.js')
      ];
      
      let nodesPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          nodesPath = testPath;
          break;
        }
      }
      
      if (nodesPath) {
        delete require.cache[nodesPath];
        const nodesModule = require(nodesPath);
        const nodeMap = nodesModule.default || nodesModule;
        
        // Create workflow->node mapping based on common patterns
        const workflowToNodeMapping: Record<string, string> = {
          'workflow-discovery': 'workflow-discovery',
          'auth-login': 'user-login',
          'auth-register': 'user-register', 
          'auth-logout': 'user-logout',
          'verify-session': 'authentication-checker',
          'protected-example': 'authentication-checker',
          'user-find-test': 'user-find',
          'user-list-test': 'user-list',
          'user-update': 'user-update',
          'user-delete': 'user-delete',
          'email-validation-test': 'email-validator',
          'password-validation-test': 'password-validator',
          // Direct node mappings for utility nodes
          'password-hash': 'password-hash',
          'password-verify': 'password-verify',
          // Email service nodes
          'email-service-config': 'email-service-manager',
          'email-verification': 'email-verification',
          'password-reset': 'email-templates',
          // Profile nodes
          'profile-image-upload': 'profile-image-upload',
          'profile-update': 'user-profile-update',
          'theme-preferences': 'theme-preference-update',
          
          // Notification nodes
          'create-notification': 'create-notification',
          'user-notifications': 'get-user-notifications',  // workflow key -> node key
          'mark-notification-read': 'mark-notification-read',
          'clear-all-notifications': 'clear-all-notifications',
          
          // Admin nodes
          'user-role-management': 'user-role-manager',
          
          // Security nodes  
          'rate-limit-test': 'rate-limiter',
          'two-factor-auth': 'two-factor-auth',
        };
        
        const nodeName = workflowToNodeMapping[workflowKey];
        if (nodeName && nodeMap[nodeName]) {
          const nodeInstance = nodeMap[nodeName];
          if (nodeInstance && typeof nodeInstance === 'object' && 'outputSchema' in nodeInstance) {
            const outputSchema = (nodeInstance as any).outputSchema;
            if (outputSchema && Object.keys(outputSchema).length > 0) {
              return outputSchema;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`[WorkflowDiscovery] Could not extract output schema for ${workflowKey}:`, error);
    }
    
    // Fallback to basic schema if we can't find the actual one
    return {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "object", additionalProperties: true },
        message: { type: "string" },
        statusCode: { type: "number" }
      },
      required: ["success"]
    };
  }

  private extractParameters(path: string): { path?: Record<string, any>; query?: Record<string, any> } {
    const parameters: any = {};
    
    // Extract path parameters (e.g., /users/:id)
    const pathParams = path.match(/:(\w+)/g);
    if (pathParams) {
      parameters.path = {};
      pathParams.forEach(param => {
        const paramName = param.substring(1); // Remove ':'
        parameters.path[paramName] = {
          type: "string",
          description: `Path parameter: ${paramName}`
        };
      });
    }

    // For now, we'll add common query parameters
    parameters.query = {
      page: { type: "number", description: "Page number for pagination" },
      limit: { type: "number", description: "Number of items per page" },
      search: { type: "string", description: "Search query" }
    };

    return parameters;
  }

  private canUserAccessWorkflow(workflow: WorkflowSchema, userRole: string, isAuthenticated: boolean): boolean {
    // If workflow doesn't require auth, everyone can access
    if (!workflow.authRequired) {
      return true;
    }

    // If auth is required but user is not authenticated
    if (workflow.authRequired && !isAuthenticated) {
      return false;
    }

    // Check if user role is in allowed roles
    return workflow.roles.includes(userRole);
  }
}
