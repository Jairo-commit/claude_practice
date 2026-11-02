import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchChangedFiles, fetchPullRequest, resolvePr, shapeFeedback } from "./github.js";
import addressPrFeedback from "../workflows/address-pr-feedback.md";

const WORKFLOWS: Record<string, { description: string; text: string }> = {
  "address-pr-feedback": {
    description: "Work through reviewers' comments on a pull request: read, plan, apply in small reviewed steps",
    text: addressPrFeedback,
  },
};

const prArgs = {
  pr: z
    .string()
    .optional()
    .describe("Pull request number or URL. Defaults to the pull request of the current branch."),
  repo: z
    .string()
    .optional()
    .describe("Repository in owner/name form, when pr is a number from a repository other than the current one."),
};

function text(value: unknown) {
  return { content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] };
}

function failure(error: unknown) {
  return { ...text(error instanceof Error ? error.message : String(error)), isError: true };
}

const server = new McpServer({ name: "pr-feedback", version: "0.1.0" });

server.registerTool(
  "get_pr_feedback",
  {
    title: "Get PR feedback",
    description:
      "Fetch every review, conversation comment and inline review thread (with replies, file, line, resolved and outdated state) of a GitHub pull request.",
    inputSchema: prArgs,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ pr, repo }) => {
    try {
      const ref = await resolvePr(pr, repo);
      return text(shapeFeedback(ref, await fetchPullRequest(ref)));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  "get_pr_changed_files",
  {
    title: "Get PR changed files",
    description: "List the files a GitHub pull request changes, to tell which edits stay inside the PR.",
    inputSchema: prArgs,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ pr, repo }) => {
    try {
      const ref = await resolvePr(pr, repo);
      return text({ pullRequest: `${ref.owner}/${ref.name}#${ref.number}`, files: await fetchChangedFiles(ref) });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  "get_workflow",
  {
    title: "Get workflow",
    description: `Return the instructions of a workflow. Available: ${Object.keys(WORKFLOWS).join(", ")}.`,
    inputSchema: { name: z.enum(Object.keys(WORKFLOWS) as [string, ...string[]]) },
    annotations: { readOnlyHint: true },
  },
  async ({ name }) => text(WORKFLOWS[name].text),
);

server.registerPrompt(
  "address-pr-feedback",
  {
    title: "Address PR feedback",
    description: WORKFLOWS["address-pr-feedback"].description,
    argsSchema: { pr: prArgs.pr },
  },
  ({ pr }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `${WORKFLOWS["address-pr-feedback"].text}\n\n---\n\nFollow this workflow for pull request ${pr || "of the current branch"}. Start with step 1.`,
        },
      },
    ],
  }),
);

await server.connect(new StdioServerTransport());
