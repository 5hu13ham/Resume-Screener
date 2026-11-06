import { promises as fs } from "fs";
import path from "path";

import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";
import type { ScreeningRepository } from "@/src/domain/ports/screening-repository";

type StoreShape = {
  sessions: Record<string, ScreeningSession>;
  candidates: Record<string, Candidate>;
};
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

// Single Node process only. Replace this adapter with a transactional repository
// before running multiple replicas or serverless workers.
let mutationQueue: Promise<void> = Promise.resolve();

async function readRawStore(): Promise<StoreShape> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    return JSON.parse(await fs.readFile(STORE_PATH, "utf8")) as StoreShape;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { sessions: {}, candidates: {} };
    }
    throw error; // Never silently reset corrupted data.
  }
}

async function readStore(): Promise<StoreShape> {
  await mutationQueue;
  return readRawStore();
}

function mutateStore<T>(update: (store: StoreShape) => T): Promise<T> {
  const job = mutationQueue.then(async () => {
    const store = await readRawStore();
    const result = update(store);
    const temp = path.join(DATA_DIR, "store-" + crypto.randomUUID() + ".tmp");
    try {
      await fs.writeFile(temp, JSON.stringify(store, null, 2), { encoding: "utf8", flag: "wx" });
      await fs.rename(temp, STORE_PATH);
    } finally {
      await fs.rm(temp, { force: true });
    }
    return result;
  });
  mutationQueue = job.then(() => undefined, () => undefined);
  return job;
}

export class FileScreeningRepository implements ScreeningRepository {
  async listSessions(userId: string): Promise<ScreeningSession[]> {
    const store = await readStore();
    return Object.values(store.sessions)
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getSession(userId: string, sessionId: string): Promise<ScreeningSession | null> {
    const session = (await readStore()).sessions[sessionId];
    return session?.userId === userId ? session : null;
  }
  async saveSession(session: ScreeningSession): Promise<ScreeningSession> {
    return mutateStore((store) => {
      store.sessions[session.id] = session;
      return session;
    });
  }
  async listCandidatesBySession(userId: string, sessionId: string): Promise<Candidate[]> {
    const store = await readStore();
    return Object.values(store.candidates)
      .filter((c) => c.userId === userId && c.sessionId === sessionId)
      .sort((a, b) => {
        if (a.rank != null && b.rank != null) return a.rank - b.rank;
        if (a.rank != null) return -1;
        if (b.rank != null) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }
  async listCandidates(userId: string): Promise<Candidate[]> {
    const store = await readStore();
    return Object.values(store.candidates)
      .filter((c) => c.userId === userId)
      .sort((a, b) => (b.evaluation?.overallMatchScore ?? -1) -
                       (a.evaluation?.overallMatchScore ?? -1));
  }
  async getCandidate(userId: string, candidateId: string): Promise<Candidate | null> {
    const candidate = (await readStore()).candidates[candidateId];
    return candidate?.userId === userId ? candidate : null;
  }
  async saveCandidate(candidate: Candidate): Promise<Candidate> {
    return mutateStore((store) => {
      store.candidates[candidate.id] = candidate;
      return candidate;
    });
  }
  async saveCandidates(candidates: Candidate[]): Promise<Candidate[]> {
    return mutateStore((store) => {
      for (const candidate of candidates) store.candidates[candidate.id] = candidate;
      return candidates;
    });
  }
  async deleteSessions(userId: string, sessionIds: string[]): Promise<void> {
    if (!sessionIds.length) return;
    await mutateStore((store) => {
      const ids = new Set(sessionIds.filter((id) => store.sessions[id]?.userId === userId));
      for (const id of ids) delete store.sessions[id];
      for (const [candidateId, candidate] of Object.entries(store.candidates)) {
        if (candidate.userId === userId && ids.has(candidate.sessionId)) {
          delete store.candidates[candidateId];
        }
      }
    });
  }
}
