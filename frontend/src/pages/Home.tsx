import {
  ArrowRight,
  Boxes,
  CheckCircle,
  Code2,
  GitBranch,
  Play,
  Terminal,
  Workflow,
} from "lucide-react";

import { Badge } from "../components/ui/badge";
import BlokLink from "../components/BlokLink";
import { Button } from "../components/ui/button";
import { GuestLayout } from "../layouts/GuestLayout";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Liquid Glass Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-emerald-400/20 to-blue-600/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-indigo-400/10 to-cyan-400/10 blur-3xl animate-pulse delay-500" />
      </div>

      <GuestLayout>
        <div className="relative z-10">
          {/* Hero Section */}
          <section className="relative py-24 px-6">
            <div className="max-w-6xl mx-auto text-center">
              <div className="mb-12">
                <Badge className="mb-6 glass-card glass-card-hover px-6 py-3 text-base font-medium">
                  ⚡ Blok Framework
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold mb-8 text-foreground leading-tight">
                  A New Way to Build
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Modern Monoliths
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed">
                  Create powerful backends using{" "}
                  <strong className="text-foreground">TypeScript Nodes</strong>{" "}
                  and{" "}
                  <strong className="text-foreground">Visual Workflows</strong>.
                  <br />
                  No more routing complexity, middleware hell, or scattered
                  business logic.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <BlokLink href="/login">
                  <Button
                    size="lg"
                    className="glass-button glass-button-hover px-8 py-4 text-lg"
                  >
                    Try Live Demo <Play className="ml-2 h-5 w-5" />
                  </Button>
                </BlokLink>
                <Button
                  size="lg"
                  variant="outline"
                  className="glass-button glass-button-hover px-8 py-4 text-lg"
                  onClick={() =>
                    document
                      .getElementById("quick-start")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Quick Start <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Quick Install Preview */}
              <div className="glass-card p-8 max-w-2xl mx-auto mb-20">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Get started in seconds
                  </span>
                </div>
                <div className="bg-black/20 dark:bg-white/5 rounded-lg p-4 font-mono text-left">
                  <div className="text-emerald-400 text-sm">
                    <span className="text-muted-foreground">$</span> npx
                    nanoctl@latest create node
                  </div>
                  <div className="text-blue-400 text-sm mt-1">
                    <span className="text-muted-foreground">$</span> npx
                    nanoctl@latest create workflow
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Node & Workflow Showcase */}
          <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Think in <span className="text-blue-600">Nodes</span> &{" "}
                  <span className="text-purple-600">Workflows</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                  Blok Framework revolutionizes backend development with visual,
                  reusable components.
                  <br />
                  Build complex applications by connecting simple, testable
                  pieces.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                {/* Nodes Section */}
                <div className="glass-card glass-card-hover p-8">
                  <div className="glass-icon-container w-fit mb-6">
                    <Boxes className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">
                    TypeScript Nodes
                  </h3>
                  <p className="text-muted-foreground mb-6 text-lg">
                    Encapsulated business logic with built-in validation, error
                    handling, and type safety.
                  </p>

                  <div className="bg-black/20 dark:bg-white/5 rounded-lg p-4 font-mono text-sm mb-6">
                    <div className="text-blue-400 mb-2">// user-login node</div>
                    <div className="text-gray-300">
                      export default class UserLogin extends NanoService {"{"}
                    </div>
                    <div className="text-gray-300 ml-4">
                      async handle(ctx, inputs) {"{"}
                    </div>
                    <div className="text-gray-300 ml-8">
                      // Validate credentials
                    </div>
                    <div className="text-gray-300 ml-8">
                      // Generate JWT token
                    </div>
                    <div className="text-gray-300 ml-8">
                      // Store in context
                    </div>
                    <div className="text-gray-300 ml-4">{"}"}</div>
                    <div className="text-gray-300">{"}"}</div>
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                      <span className="text-muted-foreground">
                        JSON Schema validation built-in
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                      <span className="text-muted-foreground">
                        Automatic error handling
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                      <span className="text-muted-foreground">
                        Reusable across workflows
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Workflows Section */}
                <div className="glass-card glass-card-hover p-8">
                  <div className="glass-icon-container w-fit mb-6">
                    <Workflow className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">
                    Visual Workflows
                  </h3>
                  <p className="text-muted-foreground mb-6 text-lg">
                    Orchestrate nodes into powerful API endpoints with
                    conditional logic and error handling.
                  </p>

                  <div className="bg-black/20 dark:bg-white/5 rounded-lg p-4 font-mono text-sm mb-6">
                    <div className="text-purple-400 mb-2">
                      // /api/login workflow
                    </div>
                    <div className="text-gray-300">Workflow({"{"}</div>
                    <div className="text-gray-300 ml-4">
                      name: "user-authentication"
                    </div>
                    <div className="text-gray-300">{"}"}) </div>
                    <div className="text-gray-300">
                      .addTrigger("http", {"{"} method: "POST" {"}"})
                    </div>
                    <div className="text-gray-300">.addCondition({"{"}</div>
                    <div className="text-gray-300 ml-4">node: "user-login"</div>
                    <div className="text-gray-300">{"}"})</div>
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                      <span className="text-muted-foreground">
                        HTTP triggers & routing
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                      <span className="text-muted-foreground">
                        Conditional execution paths
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                      <span className="text-muted-foreground">
                        Automatic API endpoint creation
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Framework Comparison */}
              <div className="glass-card p-8 mb-20">
                <h3 className="text-3xl font-bold mb-8 text-center text-foreground">
                  Why Choose Blok Over Traditional Frameworks?
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-4 text-muted-foreground font-medium">
                          Feature
                        </th>
                        <th className="text-center py-4 px-4 text-blue-600 font-bold">
                          Blok Framework
                        </th>
                        <th className="text-center py-4 px-4 text-muted-foreground">
                          Express.js
                        </th>
                        <th className="text-center py-4 px-4 text-muted-foreground">
                          Fastify
                        </th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      <tr className="border-b border-border/50">
                        <td className="py-4 px-4 font-medium">Setup Time</td>
                        <td className="text-center py-4 px-4 text-emerald-500 font-medium">
                          Minutes
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Hours
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Hours
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-4 px-4 font-medium">
                          Business Logic
                        </td>
                        <td className="text-center py-4 px-4 text-emerald-500 font-medium">
                          Encapsulated Nodes
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Scattered Routes
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Plugin System
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-4 px-4 font-medium">
                          Error Handling
                        </td>
                        <td className="text-center py-4 px-4 text-emerald-500 font-medium">
                          Built-in
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Manual
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Manual
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-4 px-4 font-medium">Validation</td>
                        <td className="text-center py-4 px-4 text-emerald-500 font-medium">
                          JSON Schema
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Third-party
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Third-party
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-4 px-4 font-medium">Testing</td>
                        <td className="text-center py-4 px-4 text-emerald-500 font-medium">
                          Node-level
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Integration
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Integration
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-medium">Reusability</td>
                        <td className="text-center py-4 px-4 text-emerald-500 font-medium">
                          High
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Low
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          Medium
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Start Section */}
          <section id="quick-start" className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Get Started in{" "}
                  <span className="text-emerald-600">3 Steps</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  From zero to production-ready API in minutes, not hours.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {/* Step 1 */}
                <div className="glass-card glass-card-hover p-8 text-center">
                  <div className="glass-icon-container w-fit mx-auto mb-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white font-bold">
                      1
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    Create a Node
                  </h3>
                  <div className="bg-black/20 dark:bg-white/5 rounded-lg p-3 font-mono text-sm mb-4">
                    <div className="text-emerald-400">
                      npx nanoctl@latest create node
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Generate a TypeScript node with built-in validation and
                    error handling.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="glass-card glass-card-hover p-8 text-center">
                  <div className="glass-icon-container w-fit mx-auto mb-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold">
                      2
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    Create a Workflow
                  </h3>
                  <div className="bg-black/20 dark:bg-white/5 rounded-lg p-3 font-mono text-sm mb-4">
                    <div className="text-blue-400">
                      npx nanoctl@latest create workflow
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Orchestrate your nodes into powerful API endpoints with
                    routing.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="glass-card glass-card-hover p-8 text-center">
                  <div className="glass-icon-container w-fit mx-auto mb-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-bold">
                      3
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    Deploy & Scale
                  </h3>
                  <div className="bg-black/20 dark:bg-white/5 rounded-lg p-3 font-mono text-sm mb-4">
                    <div className="text-purple-400">npm start</div>
                  </div>
                  <p className="text-muted-foreground">
                    Your API is live with automatic documentation and
                    monitoring.
                  </p>
                </div>
              </div>

              {/* Real Example */}
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold mb-6 text-center text-foreground">
                  See It In Action: Our Admin Dashboard
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                      <Code2 className="h-5 w-5 mr-2 text-blue-500" />
                      Authentication Node
                    </h4>
                    <div className="bg-black/20 dark:bg-white/5 rounded-lg p-4 font-mono text-sm">
                      <div className="text-blue-400 mb-2">
                        src/nodes/auth/user-login/
                      </div>
                      <div className="text-gray-300">• Password validation</div>
                      <div className="text-gray-300">
                        • JWT token generation
                      </div>
                      <div className="text-gray-300">• Session management</div>
                      <div className="text-gray-300">• Error handling</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                      <Workflow className="h-5 w-5 mr-2 text-purple-500" />
                      Login Workflow
                    </h4>
                    <div className="bg-black/20 dark:bg-white/5 rounded-lg p-4 font-mono text-sm">
                      <div className="text-purple-400 mb-2">
                        src/workflows/auth/login.ts
                      </div>
                      <div className="text-gray-300">POST /api/login</div>
                      <div className="text-gray-300">→ validate-input node</div>
                      <div className="text-gray-300">→ user-login node</div>
                      <div className="text-gray-300">→ success response</div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <p className="text-muted-foreground mb-6">
                    This entire admin dashboard with authentication, user
                    management, and security features was built using just{" "}
                    <strong className="text-foreground">12 nodes</strong> and{" "}
                    <strong className="text-foreground">8 workflows</strong>.
                  </p>
                  <BlokLink href="/login">
                    <Button
                      size="lg"
                      className="glass-button glass-button-hover px-8 py-4"
                    >
                      Explore Live Demo <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </BlokLink>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="glass-card p-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Ready to Build the Future?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                  Join the growing community of developers who've discovered a
                  better way to build backends.
                  <br />
                  <strong className="text-foreground">
                    Modern Monoliths
                  </strong>{" "}
                  with{" "}
                  <strong className="text-foreground">Visual Workflows</strong>{" "}
                  are here.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <BlokLink href="/login">
                    <Button
                      size="lg"
                      className="glass-button glass-button-hover px-8 py-4 text-lg"
                    >
                      Try Live Demo <Play className="ml-2 h-5 w-5" />
                    </Button>
                  </BlokLink>
                  <Button
                    size="lg"
                    variant="outline"
                    className="glass-button glass-button-hover px-8 py-4 text-lg"
                    onClick={() =>
                      window.open("https://github.com/your-repo", "_blank")
                    }
                  >
                    View on GitHub <GitBranch className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </GuestLayout>
    </div>
  );
}
