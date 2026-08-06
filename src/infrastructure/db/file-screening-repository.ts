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

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    const empty: StoreShape = { sessions: {}, candidates: {} };
    await fs.writeFile(STORE_PATH, JSON.stringify(empty, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(raw) as StoreShape;
}

async function writeStore(store: StoreShape): Promise<void> {
  await ensureStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export class FileScreeningRepository implements ScreeningRepository {
  async listSessions(userId: string): Promise<ScreeningSession[]> {
    const store = await readStore();
    return Object.values(store.sessions)
      .filter((session) => session.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getSession(
    userId: string,
    sessionId: string,
  ): Promise<ScreeningSession | null> {
    const store = await readStore();
    const session = store.sessions[sessionId];
    if (!session || session.userId !== userId) return null;
    return session;
  }

  async saveSession(session: ScreeningSession): Promise<ScreeningSession> {
    const store = await readStore();
    store.sessions[session.id] = session;
    await writeStore(store);
    return session;
  }

  async listCandidatesBySession(
    userId: string,
    sessionId: string,
  ): Promise<Candidate[]> {
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
      .sort((a, b) => {
        const aScore = a.evaluation?.overallMatchScore ?? -1;
        const bScore = b.evaluation?.overallMatchScore ?? -1;
        return bScore - aScore;
      });
  }

  async getCandidate(
    userId: string,
    candidateId: string,
  ): Promise<Candidate | null> {
    const store = await readStore();
    const candidate = store.candidates[candidateId];
    if (!candidate || candidate.userId !== userId) return null;
    return candidate;
  }

  async saveCandidate(candidate: Candidate): Promise<Candidate> {
    const store = await readStore();
    store.candidates[candidate.id] = candidate;
    await writeStore(store);
    return candidate;
  }

  async saveCandidates(candidates: Candidate[]): Promise<Candidate[]> {
    const store = await readStore();
    for (const candidate of candidates) {
      store.candidates[candidate.id] = candidate;
    }
    await writeStore(store);
    return candidates;
  }
}
