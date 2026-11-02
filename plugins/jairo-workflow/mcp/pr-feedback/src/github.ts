import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface PrRef {
  owner: string;
  name: string;
  number: number;
}

interface Author {
  login: string;
}

interface Connection<T> {
  nodes: T[];
  pageInfo: { hasNextPage: boolean };
}

interface ThreadComment {
  databaseId: number;
  author: Author | null;
  body: string;
  createdAt: string;
  url: string;
  replyTo: { databaseId: number } | null;
}

export interface RawPullRequest {
  title: string;
  url: string;
  state: string;
  isDraft: boolean;
  reviewDecision: string | null;
  headRefName: string;
  baseRefName: string;
  author: Author | null;
  reviews: Connection<{ author: Author | null; state: string; body: string; submittedAt: string; url: string }>;
  comments: Connection<{ author: Author | null; body: string; createdAt: string; url: string }>;
  reviewThreads: Connection<{
    isResolved: boolean;
    isOutdated: boolean;
    path: string;
    line: number | null;
    originalLine: number | null;
    startLine: number | null;
    comments: Connection<ThreadComment>;
  }>;
}

const PULL_REQUEST_QUERY = `
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      title url state isDraft reviewDecision headRefName baseRefName
      author { login }
      reviews(first: 100) {
        nodes { author { login } state body submittedAt url }
        pageInfo { hasNextPage }
      }
      comments(first: 100) {
        nodes { author { login } body createdAt url }
        pageInfo { hasNextPage }
      }
      reviewThreads(first: 100) {
        nodes {
          isResolved isOutdated path line originalLine startLine
          comments(first: 100) {
            nodes { databaseId author { login } body createdAt url replyTo { databaseId } }
            pageInfo { hasNextPage }
          }
        }
        pageInfo { hasNextPage }
      }
    }
  }
}`;

const PR_URL_PATTERN = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
const REPO_PATTERN = /^([^/\s]+)\/([^/\s]+)$/;

export function workingDirectory(): string {
  return process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
}

async function gh(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("gh", args, {
      cwd: workingDirectory(),
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(`gh ${args[0]} ${args[1] ?? ""} failed: ${stderr || (error as Error).message}`);
  }
}

export function parsePrUrl(url: string): PrRef | null {
  const match = PR_URL_PATTERN.exec(url);
  if (!match) return null;
  return { owner: match[1], name: match[2], number: Number(match[3]) };
}

export async function resolvePr(pr?: string, repo?: string): Promise<PrRef> {
  const fromUrl = pr ? parsePrUrl(pr) : null;
  if (fromUrl) return fromUrl;

  if (pr && !/^#?\d+$/.test(pr.trim())) {
    throw new Error(`"${pr}" is not a pull request number or URL`);
  }
  const number = pr ? Number(pr.trim().replace("#", "")) : undefined;

  if (repo) {
    const match = REPO_PATTERN.exec(repo.trim());
    if (!match) throw new Error(`"${repo}" is not in owner/name form`);
    if (number !== undefined) return { owner: match[1], name: match[2], number };
  }

  const viewArgs = ["pr", "view", ...(number !== undefined ? [String(number)] : []), "--json", "url"];
  if (repo) viewArgs.push("--repo", repo.trim());
  const { url } = JSON.parse(await gh(viewArgs)) as { url: string };
  const resolved = parsePrUrl(url);
  if (!resolved) throw new Error(`gh returned an unexpected pull request URL: ${url}`);
  return resolved;
}

export async function fetchPullRequest(ref: PrRef): Promise<RawPullRequest> {
  const stdout = await gh([
    "api",
    "graphql",
    "-f",
    `query=${PULL_REQUEST_QUERY}`,
    "-F",
    `owner=${ref.owner}`,
    "-F",
    `name=${ref.name}`,
    "-F",
    `number=${ref.number}`,
  ]);
  const pullRequest = JSON.parse(stdout).data?.repository?.pullRequest as RawPullRequest | null;
  if (!pullRequest) throw new Error(`Pull request ${ref.owner}/${ref.name}#${ref.number} was not found`);
  return pullRequest;
}

export async function fetchChangedFiles(ref: PrRef): Promise<string[]> {
  const stdout = await gh([
    "pr",
    "diff",
    String(ref.number),
    "--repo",
    `${ref.owner}/${ref.name}`,
    "--name-only",
  ]);
  return stdout.split("\n").filter(Boolean);
}

function login(author: Author | null): string {
  return author?.login ?? "ghost";
}

export function shapeFeedback(ref: PrRef, pr: RawPullRequest) {
  const truncated: string[] = [];
  if (pr.reviews.pageInfo.hasNextPage) truncated.push("reviews beyond the first 100");
  if (pr.comments.pageInfo.hasNextPage) truncated.push("conversation comments beyond the first 100");
  if (pr.reviewThreads.pageInfo.hasNextPage) truncated.push("review threads beyond the first 100");

  const threads = pr.reviewThreads.nodes.map((thread) => {
    if (thread.comments.pageInfo.hasNextPage) {
      truncated.push(`replies beyond the first 100 in the thread on ${thread.path}`);
    }
    return {
      path: thread.path,
      line: thread.line ?? thread.originalLine,
      startLine: thread.startLine,
      resolved: thread.isResolved,
      outdated: thread.isOutdated,
      comments: thread.comments.nodes.map((comment) => ({
        id: comment.databaseId,
        author: login(comment.author),
        body: comment.body,
        createdAt: comment.createdAt,
        inReplyTo: comment.replyTo?.databaseId ?? null,
        url: comment.url,
      })),
    };
  });

  const reviews = pr.reviews.nodes
    .filter((review) => review.body.trim() !== "" || review.state !== "COMMENTED")
    .map((review) => ({
      author: login(review.author),
      state: review.state,
      body: review.body,
      submittedAt: review.submittedAt,
      url: review.url,
    }));

  return {
    pullRequest: {
      repository: `${ref.owner}/${ref.name}`,
      number: ref.number,
      title: pr.title,
      url: pr.url,
      state: pr.state,
      draft: pr.isDraft,
      author: login(pr.author),
      head: pr.headRefName,
      base: pr.baseRefName,
      reviewDecision: pr.reviewDecision,
    },
    counts: {
      reviews: reviews.length,
      conversationComments: pr.comments.nodes.length,
      threads: threads.length,
      unresolvedThreads: threads.filter((thread) => !thread.resolved).length,
    },
    reviews,
    conversationComments: pr.comments.nodes.map((comment) => ({
      author: login(comment.author),
      body: comment.body,
      createdAt: comment.createdAt,
      url: comment.url,
    })),
    threads,
    truncated,
  };
}
