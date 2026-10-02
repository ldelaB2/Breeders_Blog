import { Prisma } from "@prisma/client";

// Every model in schema.prisma, as its Prisma client delegate name
// (prisma[delegate]) and its table name - read from the generated client, so
// a new model is never missed. Used by scripts/reset-for-launch.js and the
// test harness, which both empty every table.
export const MODELS = Prisma.dmmf.datamodel.models.map((m) => ({
  delegate: m.name[0].toLowerCase() + m.name.slice(1),
  table: m.dbName ?? m.name,
}));
