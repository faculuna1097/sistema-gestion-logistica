// src/services/clientes.service.ts

import * as clientesRepository from '../repositories/clientes.repository';
import { Cliente, CreateClienteDTO } from '../types';

export async function getAll(): Promise<Cliente[]> {
  return clientesRepository.getAll();
}

export async function getById(id: number): Promise<Cliente | null> {
  return clientesRepository.getById(id);
}

export async function create(data: CreateClienteDTO): Promise<Cliente> {
  return clientesRepository.create(data);
}

export async function update(id: number, data: Partial<CreateClienteDTO>): Promise<Cliente | null> {
  return clientesRepository.update(id, data);
}

export async function remove(id: number): Promise<Cliente | null> {
  return clientesRepository.remove(id);
}