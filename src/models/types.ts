import { type ExtractTablesWithRelations } from 'drizzle-orm'
import { type MySqlTransaction } from 'drizzle-orm/mysql-core'
import {
  type MySql2PreparedQueryHKT,
  type MySql2QueryResultHKT
} from 'drizzle-orm/mysql2'

export type MySqlDBTransaction = MySqlTransaction<
  MySql2QueryResultHKT,
  MySql2PreparedQueryHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>
