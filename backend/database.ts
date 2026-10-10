import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Prisma } from "./generated/client"
export { Prisma }
export type Database = PrismaClient
export type Transaction = Prisma.TransactionClient
export const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value))
export function database(connectionString: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 10 }) })
}
export async function transaction<T>(db: Database, run: (tx: Transaction) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await db.$transaction(run, { isolationLevel: "Serializable", maxWait: 10000, timeout: 15000 }) }
    catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt >= 4) throw error
    }
  }
}
