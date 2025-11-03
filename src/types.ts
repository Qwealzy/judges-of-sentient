// src/types.ts
import type { Database } from './lib/database.types';

export type { Database };

export type PledgeResult =
  Database['public']['Tables']['pledges']['Row'];

export type PledgeInsert =
  Database['public']['Tables']['pledges']['Insert'];

export type PledgeUpdate =
  Database['public']['Tables']['pledges']['Update'];
