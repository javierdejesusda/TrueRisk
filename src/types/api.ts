export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HackathonAuthResponse {
  token: string;
}

export interface HackathonWeatherResponse {
  [key: string]: string | number | null;
}

export interface HackathonPromptResponse {
  response: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
