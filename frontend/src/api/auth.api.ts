import api from './axios';
import type { User, CreateUserDTO, UserLoginDTO, UserLoginResponse, UpdateUserDTO, StepikOAuthConfig } from '../types';

export const authApi = {
  // User registration
  register: async (data: CreateUserDTO): Promise<User> => {
    const response = await api.post<User>('/v1/users', data);
    return response.data;
  },

  // User login
  login: async (data: UserLoginDTO): Promise<UserLoginResponse> => {
    const response = await api.post<UserLoginResponse>('/v1/users/login', data);
    return response.data;
  },

  // Get user by ID
  getUser: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/v1/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (data: UpdateUserDTO): Promise<User> => {
    const response = await api.put<User>('/v1/users/update', data);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/v1/users/delete/${userId}`);
  },

  // Stepik OAuth (путь без ведущего / — иначе baseURL /api может не подставляться в axios)
  getStepikOAuthConfig: async (userId: number): Promise<StepikOAuthConfig> => {
    const response = await api.get<StepikOAuthConfig>(`stepik-oauth/config/${userId}`);
    return response.data;
  },

  updateStepikOAuthConfig: async (userId: number, config: StepikOAuthConfig): Promise<string> => {
    const response = await api.post<string>(`stepik-oauth/config/${userId}`, config);
    return response.data;
  },

  clearStepikOAuthConfig: async (userId: number): Promise<string> => {
    const response = await api.delete<string>(`stepik-oauth/config/${userId}`);
    return response.data;
  },

  hasStepikOAuthConfig: async (userId: number): Promise<boolean> => {
    const response = await api.get<boolean>(`stepik-oauth/config/${userId}/status`);
    return response.data;
  },
};

