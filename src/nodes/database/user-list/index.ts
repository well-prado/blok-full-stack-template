import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import { db } from '../../../../database/config';

type UserListInputType = {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: 'admin' | 'user';
  emailVerified?: boolean;
};

type ListedUserType = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type PaginationInfoType = {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
};

type UserListOutputType = {
  success: boolean;
  users: ListedUserType[];
  pagination: PaginationInfoType;
  message: string;
  statusCode: number;
};

export default class UserList extends NanoService<UserListInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        page: {
          type: "number",
          minimum: 1,
          default: 1,
          description: "Page number (default: 1)"
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 20,
          description: "Number of users per page (default: 20, max: 100)"
        },
        sortBy: {
          type: "string",
          enum: ["createdAt", "updatedAt", "name", "email"],
          default: "createdAt",
          description: "Field to sort by (default: createdAt)"
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
          description: "Sort order (default: desc)"
        },
        search: {
          type: "string",
          description: "Search term for name or email"
        },
        role: {
          type: "string",
          enum: ["admin", "user"],
          description: "Filter by user role"
        },
        emailVerified: {
          type: "boolean",
          description: "Filter by email verification status"
        }
      }
    };

    // Define comprehensive output schema for perfect SDK type generation
    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the user list was retrieved successfully"
        },
        users: {
          type: "array",
          description: "Array of users matching the criteria",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique user identifier"
              },
              email: {
                type: "string",
                format: "email",
                description: "User's email address"
              },
              name: {
                type: "string",
                description: "User's full name"
              },
              role: {
                type: "string",
                enum: ["admin", "user"],
                description: "User's role"
              },
              emailVerified: {
                type: "boolean",
                description: "Whether user's email is verified"
              },
              createdAt: {
                type: "string",
                format: "date-time",
                description: "Account creation timestamp"
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                description: "Last update timestamp"
              }
            },
            required: ["id", "email", "name", "role", "emailVerified", "createdAt", "updatedAt"]
          }
        },
        pagination: {
          type: "object",
          description: "Pagination information",
          properties: {
            currentPage: {
              type: "number",
              minimum: 1,
              description: "Current page number"
            },
            totalPages: {
              type: "number",
              minimum: 0,
              description: "Total number of pages"
            },
            totalUsers: {
              type: "number",
              minimum: 0,
              description: "Total number of users matching criteria"
            },
            hasNext: {
              type: "boolean",
              description: "Whether there is a next page"
            },
            hasPrev: {
              type: "boolean",
              description: "Whether there is a previous page"
            },
            limit: {
              type: "number",
              minimum: 1,
              description: "Number of users per page"
            }
          },
          required: ["currentPage", "totalPages", "totalUsers", "hasNext", "hasPrev", "limit"]
        },
        message: {
          type: "string",
          description: "Human-readable result message"
        },
        statusCode: {
          type: "number",
          description: "HTTP status code",
          enum: [200, 400, 500]
        }
      },
      required: ["success", "users", "pagination", "message", "statusCode"]
    };
  }

  async handle(ctx: Context, inputs: UserListInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Set defaults
      const page = inputs.page || 1;
      const limit = Math.min(inputs.limit || 20, 100);
      const sortBy = inputs.sortBy || 'createdAt';
      const sortOrder = inputs.sortOrder || 'desc';
      const offset = (page - 1) * limit;

      ctx.logger.log(`Listing users: page ${page}, limit ${limit}, sortBy ${sortBy} ${sortOrder}`);

      // Build where conditions for Prisma
      const where: any = {};
      
      if (inputs.search) {
        where.OR = [
          { name: { contains: inputs.search } },
          { email: { contains: inputs.search } }
        ];
      }

      if (inputs.role) {
        where.role = inputs.role === 'admin' ? 'ADMIN' : 'USER';
      }

      if (typeof inputs.emailVerified === 'boolean') {
        where.emailVerified = inputs.emailVerified;
      }

      // Build order by clause for Prisma
      const orderBy: any = {};
      switch (sortBy) {
        case 'createdAt':
          orderBy.createdAt = sortOrder;
          break;
        case 'updatedAt':
          orderBy.updatedAt = sortOrder;
          break;
        case 'name':
          orderBy.name = sortOrder;
          break;
        case 'email':
          orderBy.email = sortOrder;
          break;
        default:
          orderBy.createdAt = 'desc';
      }

      // Get total count for pagination
      const totalUsers = await db.user.count({
        where
      });

      const totalPages = Math.ceil(totalUsers / limit);

      // Get users with pagination
      const userResults = await db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy,
        take: limit,
        skip: offset
      });

      // Map results to proper type
      const userList: ListedUserType[] = userResults.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }));

      // Build pagination info
      const pagination: PaginationInfoType = {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      };

      const result: UserListOutputType = {
        success: true,
        users: userList,
        pagination,
        message: `Found ${userList.length} users`,
        statusCode: 200
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.userListResult = result as unknown as ParamsDictionary;
      ctx.vars.userList = userList as unknown as ParamsDictionary;
      ctx.vars.pagination = pagination as unknown as ParamsDictionary;

      ctx.logger.log(`Listed ${userList.length} users (page ${page}/${totalPages}, total: ${totalUsers})`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "User list operation failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('User list error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }
}
