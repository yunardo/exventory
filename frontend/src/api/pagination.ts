export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export function unwrapPaginatedResponse<T>(
  data: T[] | PaginatedResponse<T>
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
}