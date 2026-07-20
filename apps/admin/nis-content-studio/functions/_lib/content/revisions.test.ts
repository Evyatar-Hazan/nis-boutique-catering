import { describe, expect, it } from "vitest";

import { ApiError } from "../http/errors";
import { createPublicSiteDocument } from "../test/publicSiteDocument";
import { readDraftRevision, saveDraftRevision } from "./revisions";

interface StoredRow {
  content_json: string;
  created_at: number;
  created_by: string;
  id: string;
  schema_version: number;
  status: "draft" | "published" | "archived";
  updated_at: number;
  updated_by: string | null;
  version: number;
}

class RevisionDatabase {
  draft: StoredRow | null = null;
  readonly published: StoredRow = {
    content_json: JSON.stringify(createPublicSiteDocument("published-1")),
    created_at: 900,
    created_by: "admin-1",
    id: "published-1",
    schema_version: 2,
    status: "published",
    updated_at: 900,
    updated_by: "admin-1",
    version: 1,
  };

  prepare(query: string): D1PreparedStatement {
    const state = { database: this };
    return {
      async first<Result>() {
        if (query.startsWith("SELECT")) {
          return state.database.draft as Result | null;
        }
        throw new Error(`Unexpected unbound query: ${query}`);
      },
      bind(...values: unknown[]) {
        return {
          async first<Result>() {
            if (query.startsWith("INSERT")) {
              if (state.database.draft) {
                return null;
              }
              const [id, schemaVersion, contentJson, adminId, nowSeconds] = values as [
                string,
                number,
                string,
                string,
                number,
              ];
              state.database.draft = {
                content_json: contentJson,
                created_at: nowSeconds,
                created_by: adminId,
                id,
                schema_version: schemaVersion,
                status: "draft",
                updated_at: nowSeconds,
                updated_by: adminId,
                version: 1,
              };
              return state.database.draft as Result;
            }

            if (query.startsWith("UPDATE content_revisions")) {
              const [contentJson, schemaVersion, adminId, nowSeconds, expectedVersion] = values as [
                string,
                number,
                string,
                number,
                number,
              ];
              if (!state.database.draft || state.database.draft.version !== expectedVersion) {
                return null;
              }
              state.database.draft = {
                ...state.database.draft,
                content_json: contentJson,
                schema_version: schemaVersion,
                updated_at: nowSeconds,
                updated_by: adminId,
                version: expectedVersion + 1,
              };
              return state.database.draft as Result;
            }

            throw new Error(`Unexpected query: ${query}`);
          },
        } as D1PreparedStatement;
      },
    } as D1PreparedStatement;
  }
}

const asD1Database = (database: RevisionDatabase): D1Database =>
  database as unknown as D1Database;

describe("draft revision repository", () => {
  it("saves and reloads a complete validated snapshot without changing published", async () => {
    const database = new RevisionDatabase();
    const publishedBefore = structuredClone(database.published);
    const content = createPublicSiteDocument();

    const saved = await saveDraftRevision(
      asD1Database(database),
      { adminId: "admin-1", content, expectedVersion: null },
      1_000,
    );
    const reloaded = await readDraftRevision(asD1Database(database));

    expect(saved.version).toBe(1);
    expect(reloaded).toEqual(saved);
    expect(reloaded?.content).toEqual(content);
    expect(database.published).toEqual(publishedBefore);
  });

  it("increments atomically and preserves created-by audit", async () => {
    const database = new RevisionDatabase();
    await saveDraftRevision(
      asD1Database(database),
      { adminId: "admin-1", content: createPublicSiteDocument(), expectedVersion: null },
      1_000,
    );

    const updated = await saveDraftRevision(
      asD1Database(database),
      {
        adminId: "admin-2",
        content: createPublicSiteDocument("revision-2"),
        expectedVersion: 1,
      },
      1_100,
    );

    expect(updated).toMatchObject({
      createdBy: "admin-1",
      updatedBy: "admin-2",
      version: 2,
    });
  });

  it("returns 409 for a concurrent stale save and keeps the winning content", async () => {
    const database = new RevisionDatabase();
    await saveDraftRevision(
      asD1Database(database),
      { adminId: "admin-1", content: createPublicSiteDocument(), expectedVersion: null },
      1_000,
    );
    await saveDraftRevision(
      asD1Database(database),
      {
        adminId: "admin-1",
        content: createPublicSiteDocument("winner"),
        expectedVersion: 1,
      },
      1_100,
    );

    await expect(
      saveDraftRevision(
        asD1Database(database),
        {
          adminId: "admin-2",
          content: createPublicSiteDocument("stale"),
          expectedVersion: 1,
        },
        1_200,
      ),
    ).rejects.toMatchObject({
      code: "revision_conflict",
      status: 409,
    } satisfies Partial<ApiError>);
    expect((await readDraftRevision(asD1Database(database)))?.content.version).toBe("winner");
  });

  it("rejects an invalid snapshot before any write", async () => {
    const database = new RevisionDatabase();

    await expect(
      saveDraftRevision(
        asD1Database(database),
        { adminId: "admin-1", content: { schemaVersion: 2 }, expectedVersion: null },
      ),
    ).rejects.toBeTruthy();
    expect(database.draft).toBeNull();
  });

  it("fails closed when stored content no longer passes the schema", async () => {
    const database = new RevisionDatabase();
    database.draft = {
      ...database.published,
      content_json: "{}",
      id: "draft-1",
      status: "draft",
    };

    await expect(readDraftRevision(asD1Database(database))).rejects.toMatchObject({
      code: "content_integrity_error",
      status: 500,
    } satisfies Partial<ApiError>);
  });
});
