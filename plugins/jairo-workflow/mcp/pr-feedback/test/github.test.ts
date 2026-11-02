import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePrUrl, resolvePr, shapeFeedback, type RawPullRequest } from "../src/github.js";

const ref = { owner: "acme", name: "shop", number: 7 };

function page<T>(nodes: T[], hasNextPage = false) {
  return { nodes, pageInfo: { hasNextPage } };
}

function pullRequest(overrides: Partial<RawPullRequest> = {}): RawPullRequest {
  return {
    title: "Add cart",
    url: "https://github.com/acme/shop/pull/7",
    state: "OPEN",
    isDraft: false,
    reviewDecision: "CHANGES_REQUESTED",
    headRefName: "add_cart",
    baseRefName: "main",
    author: { login: "dev" },
    reviews: page([]),
    comments: page([]),
    reviewThreads: page([]),
    ...overrides,
  };
}

describe("parsePrUrl", () => {
  it("returns the owner, name and number of a pull request URL", () => {
    assert.deepEqual(parsePrUrl("https://github.com/acme/shop/pull/7/files"), ref);
  });

  it("returns null for a URL that is not a pull request", () => {
    assert.equal(parsePrUrl("https://github.com/acme/shop/issues/7"), null);
  });
});

describe("resolvePr", () => {
  it("resolves a number and a repository without calling gh", async () => {
    assert.deepEqual(await resolvePr("#7", "acme/shop"), ref);
  });

  it("rejects a pr that is neither a number nor a URL", async () => {
    await assert.rejects(resolvePr("add_cart"), /not a pull request number or URL/);
  });

  it("rejects a repository that is not in owner/name form", async () => {
    await assert.rejects(resolvePr("7", "shop"), /owner\/name form/);
  });
});

describe("shapeFeedback", () => {
  it("drops empty commented reviews and keeps reviews with a body or a decision", () => {
    const feedback = shapeFeedback(
      ref,
      pullRequest({
        reviews: page([
          { author: { login: "ana" }, state: "COMMENTED", body: "", submittedAt: "t1", url: "u1" },
          { author: { login: "ana" }, state: "CHANGES_REQUESTED", body: "", submittedAt: "t2", url: "u2" },
          { author: null, state: "COMMENTED", body: "Looks close", submittedAt: "t3", url: "u3" },
        ]),
      }),
    );

    assert.deepEqual(
      feedback.reviews.map((review) => [review.author, review.state]),
      [
        ["ana", "CHANGES_REQUESTED"],
        ["ghost", "COMMENTED"],
      ],
    );
  });

  it("keeps thread replies with their parent and counts unresolved threads", () => {
    const feedback = shapeFeedback(
      ref,
      pullRequest({
        reviewThreads: page([
          {
            isResolved: false,
            isOutdated: true,
            path: "cart.py",
            line: null,
            originalLine: 12,
            startLine: null,
            comments: page([
              { databaseId: 1, author: { login: "ana" }, body: "Rename this", createdAt: "t1", url: "c1", replyTo: null },
              { databaseId: 2, author: { login: "dev" }, body: "Done", createdAt: "t2", url: "c2", replyTo: { databaseId: 1 } },
            ]),
          },
          {
            isResolved: true,
            isOutdated: false,
            path: "cart.py",
            line: 30,
            originalLine: 30,
            startLine: null,
            comments: page([]),
          },
        ]),
      }),
    );

    assert.equal(feedback.threads[0].line, 12);
    assert.equal(feedback.threads[0].comments[1].inReplyTo, 1);
    assert.deepEqual(feedback.counts, { reviews: 0, conversationComments: 0, threads: 2, unresolvedThreads: 1 });
  });

  it("lists every connection that has more pages", () => {
    const feedback = shapeFeedback(
      ref,
      pullRequest({
        comments: page([], true),
        reviewThreads: page(
          [
            {
              isResolved: false,
              isOutdated: false,
              path: "cart.py",
              line: 1,
              originalLine: 1,
              startLine: null,
              comments: page([], true),
            },
          ],
          true,
        ),
      }),
    );

    assert.deepEqual(feedback.truncated, [
      "conversation comments beyond the first 100",
      "review threads beyond the first 100",
      "replies beyond the first 100 in the thread on cart.py",
    ]);
  });
});
