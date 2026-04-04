const API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export interface Blog {
  id: string;
  slug: string;
  title: string;
  body?: string;
  excerpt?: string;
  meta_description?: string;
  tags?: string[];
  topic?: string;
  read_time?: string;
  word_count?: number;
  publish_date?: string;
  image_url?: string | null;
  image_url_full?: string | null;
  image_alt?: string;
  image_credit?: string;
  image_credit_url?: string;
  author?: string;
  status?: string;
  created_at?: string;
}

export interface Topic {
  topic: string;
  count: number;
}

export class ApiError extends Error {
  data: any;
  status: number;
  constructor(message: string, data: any, status: number) {
    super(message);
    this.name = "ApiError";
    this.data = data;
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message ||
        errorData.error ||
        `Request failed: ${response.status}`,
      errorData,
      response.status,
    );
  }
  const json = await response.json();
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return json.data as T;
  }
  return json;
}

export interface PaginatedBlogs {
  data: Blog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getBlogs(params?: {
  page?: number;
  limit?: number;
  topic?: string;
  search?: string;
}): Promise<PaginatedBlogs> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.topic && params.topic !== "All")
    query.append("topic", params.topic);
  if (params?.search) query.append("search", params.search);

  const url = `${API_BASE}/api/blogs${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message ||
        errorData.error ||
        `Request failed: ${response.status}`,
      errorData,
      response.status,
    );
  }

  const json = await response.json();
  if (json && json.success) {
    return { data: json.data as Blog[], meta: json.meta };
  }
  return json;
}

export async function getBlog(slugOrId: string): Promise<Blog> {
  return request<Blog>(`/api/blogs/${slugOrId}`);
}

export async function getTopics(): Promise<Topic[]> {
  return request<Topic[]>("/api/blogs/topics");
}

export const blogsApi = { getBlogs, getBlog, getTopics };
export default blogsApi;
