import apiClient from './apiClient';
import type { ApiResponse, User } from '../types';

export const userService = {
  getAll: (): Promise<ApiResponse<User[]>> =>
    apiClient.get<ApiResponse<User[]>>('/users').then((res) => res.data),

  getById: (id: string): Promise<ApiResponse<User>> =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`).then((res) => res.data),

  create: (payload: Omit<User, 'id' | 'createdAt'>): Promise<ApiResponse<User>> =>
    apiClient.post<ApiResponse<User>>('/users', payload).then((res) => res.data),

  update: (id: string, payload: Partial<User>): Promise<ApiResponse<User>> =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, payload).then((res) => res.data),

  delete: (id: string): Promise<ApiResponse<null>> =>
    apiClient.delete<ApiResponse<null>>(`/users/${id}`).then((res) => res.data),
};
