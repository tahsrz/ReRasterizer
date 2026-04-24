import { MongoClient } from "mongodb";

import { getServerEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

function createClient() {
  const uri = getServerEnv("MONGODB_URI");
  if (!uri) {
    throw new Error("Missing MONGODB_URI");
  }
  return new MongoClient(uri);
}

export function getMongoClient() {
  if (!global.__mongoClientPromise__) {
    global.__mongoClientPromise__ = createClient().connect();
  }
  return global.__mongoClientPromise__;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB ?? "rotoscope");
}
