/**
 * Actor endpoints.
 *
 * Covers: GET /api/actors, GET /api/actors/{id}.
 */

import { apiGet } from './client';
import type { ActorListItem, ActorDetail } from '../types/actor';

export interface ActorListParams {
  query?: string;
  page?: number;
  size?: number;
}

export async function getActors(params?: ActorListParams): Promise<ActorListItem[]> {
  const p = new URLSearchParams();
  if (params?.query) p.set('query', params.query);
  if (params?.page != null) p.set('page', String(params.page));
  if (params?.size != null) p.set('size', String(params.size));
  const qs = p.toString();
  return apiGet<ActorListItem[]>(`/actors${qs ? `?${qs}` : ''}`);
}

export async function getActorDetail(id: number): Promise<ActorDetail> {
  return apiGet<ActorDetail>(`/actors/${id}`);
}
