import api from './axios';
import type {
  User,
  CreateUserDTO,
  UserLoginDTO,
  UserLoginResponse,
  UpdateUserDTO,
  StepikOAuthConfig,
  RegistrationMessage,
  RegistrationConfig,
  VerifyEmailDTO,
  ResendVerificationDTO,
  ForgotPasswordDTO,
  PasswordResetTokenResponse,
  ResetPasswordDTO,
} from '../types';

export const authApi = {
  getRegistrationConfig: async (): Promise<RegistrationConfig> => {
    const { data } = await api.get<{
      enabled?: boolean;
      registrationEnabled?: boolean;
      inviteRequired?: boolean;
      privacyConsentVersion?: string;
    }>('/v1/users/registration-config');

    return {
      enabled: data.enabled ?? data.registrationEnabled ?? false,
      inviteRequired: Boolean(data.inviteRequired),
      privacyConsentVersion: data.privacyConsentVersion ?? '',
    };
  },

  requestRegistration: async (data: CreateUserDTO): Promise<RegistrationMessage> => {
    const response = await api.post<RegistrationMessage>('/v1/users', data);
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailDTO): Promise<UserLoginResponse> => {
    const response = await api.post<UserLoginResponse>('/v1/users/verify-email', data);
    return response.data;
  },

  resendVerification: async (data: ResendVerificationDTO): Promise<RegistrationMessage> => {
    const response = await api.post<RegistrationMessage>('/v1/users/resend-verification', data);
    return response.data;
  },

  login: async (data: UserLoginDTO): Promise<UserLoginResponse> => {
    const response = await api.post<UserLoginResponse>('/v1/users/login', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordDTO): Promise<RegistrationMessage> => {
    const response = await api.post<RegistrationMessage>('/v1/users/forgot-password', data);
    return response.data;
  },

  verifyResetCode: async (data: VerifyEmailDTO): Promise<PasswordResetTokenResponse> => {
    const response = await api.post<PasswordResetTokenResponse>('/v1/users/verify-reset-code', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordDTO): Promise<RegistrationMessage> => {
    const response = await api.post<RegistrationMessage>('/v1/users/reset-password', data);
    return response.data;
  },

  getUser: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/v1/users/${userId}`);
    return response.data;
  },

  updateUser: async (data: UpdateUserDTO): Promise<User> => {
    const response = await api.put<User>('/v1/users/update', data);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/v1/users/delete/${userId}`);
  },

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
