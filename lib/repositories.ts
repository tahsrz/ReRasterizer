import { ObjectId, type OptionalId, type WithId } from "mongodb";

import { getDatabase } from "@/lib/db";
import type { JobRecord, ProjectRecord } from "@/types";

type DbProjectRecord = Omit<ProjectRecord, "_id">;
type DbJobRecord = Omit<JobRecord, "_id">;

function nowIso() {
  return new Date().toISOString();
}

export async function createProject(input: Omit<ProjectRecord, "_id" | "createdAt" | "updatedAt">) {
  const db = await getDatabase();
  const timestamp = nowIso();
  const project: DbProjectRecord = {
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const result = await db.collection<DbProjectRecord>("projects").insertOne(project as OptionalId<DbProjectRecord>);
  return { ...project, _id: result.insertedId.toString() };
}

export async function listProjects(userId?: string | null) {
  const db = await getDatabase();
  const filter = userId ? { userId } : {};
  const projects = await db.collection<DbProjectRecord>("projects").find(filter).sort({ updatedAt: -1 }).limit(20).toArray();
  return projects.map((project) => serializeProject(project));
}

export async function getProject(projectId: string) {
  const db = await getDatabase();
  const project = await db.collection<DbProjectRecord>("projects").findOne({ _id: new ObjectId(projectId) });
  return project ? serializeProject(project) : null;
}

export async function updateProject(projectId: string, updates: Partial<ProjectRecord>) {
  const db = await getDatabase();
  const updatedAt = nowIso();
  await db
    .collection<DbProjectRecord>("projects")
    .updateOne({ _id: new ObjectId(projectId) }, { $set: { ...(updates as Partial<DbProjectRecord>), updatedAt } });
  return getProject(projectId);
}

export async function createJob(input: Omit<JobRecord, "_id" | "createdAt" | "updatedAt">) {
  const db = await getDatabase();
  const timestamp = nowIso();
  const job: DbJobRecord = {
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const result = await db.collection<DbJobRecord>("jobs").insertOne(job as OptionalId<DbJobRecord>);
  return { ...job, _id: result.insertedId.toString() };
}

export async function getJob(jobId: string) {
  const db = await getDatabase();
  const job = await db.collection<DbJobRecord>("jobs").findOne({ _id: new ObjectId(jobId) });
  return job ? serializeJob(job) : null;
}

export async function updateJob(jobId: string, updates: Partial<JobRecord>) {
  const db = await getDatabase();
  const updatedAt = nowIso();
  await db
    .collection<DbJobRecord>("jobs")
    .updateOne({ _id: new ObjectId(jobId) }, { $set: { ...(updates as Partial<DbJobRecord>), updatedAt } });
  return getJob(jobId);
}

function serializeProject(project: WithId<DbProjectRecord>): ProjectRecord {
  return { ...project, _id: project._id.toString() };
}

function serializeJob(job: WithId<DbJobRecord>): JobRecord {
  return { ...job, _id: job._id.toString() };
}
