// src/services/fleteros.service.ts

import * as fleterosRepository from '../repositories/fleteros.repository';
import { Fletero, CreateFleteroDTO } from '../types';

export async function getAll(): Promise<Fletero[]> {
  return fleterosRepository.getAll();
}

export async function getById(id: number): Promise<Fletero | null> {
  return fleterosRepository.getById(id);
}

export async function create(data: CreateFleteroDTO): Promise<Fletero> {
  return fleterosRepository.create(data);
}

export async function update(id: number, data: Partial<CreateFleteroDTO>): Promise<Fletero | null> {
  return fleterosRepository.update(id, data);
}

export async function remove(id: number): Promise<Fletero | null> {
  return fleterosRepository.remove(id);
}