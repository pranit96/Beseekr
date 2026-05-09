import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getBlogs, getBlog, getTopics, subscribeNewsletter } from "@/api/blogs";
import { useToast } from "@/hooks/use-toast";

// Query Keys
export const queryKeys = {
  agents: ["agents"] as const,
  myAgents: ["agents", "my"] as const,
  conversations: (status?: "active" | "archived") =>
    ["conversations", status] as const,
  messages: (conversationId: string, page?: number) =>
    ["messages", conversationId, page] as const,
  usageStats: (startDate?: string, endDate?: string) =>
    ["usage", "stats", startDate, endDate] as const,
  usageLogs: (params?: any) => ["usage", "logs", params] as const,
  sessionDetails: (sessionId: string) =>
    ["thinkers", "sessions", sessionId] as const,
  sessions: (params?: any) => ["thinkers", "sessions", params] as const,
  currentUser: ["auth", "me"] as const,
  blogs: (topic?: string, search?: string) => ["blogs", topic, search] as const,
  blog: (slug: string) => ["blog", slug] as const,
  blogTopics: ["blogTopics"] as const,
  notificationPreferences: ["notificationPreferences"] as const,
};

// ============= AGENTS =============

export function useAgents(params?: {
  domain?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...queryKeys.agents, params],
    queryFn: () => apiClient.getAgents(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

export function useMyAgents() {
  return useQuery({
    queryKey: queryKeys.myAgents,
    queryFn: () => apiClient.getMyAgents(),
    staleTime: 2 * 60 * 1000, // 2 minutes - agents don't change often
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (agent: any) => apiClient.createAgent(agent),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myAgents });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      if (response.data) {
        toast({
          title: "Agent created",
          description: `${response.data.name} has been created successfully.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, agent }: { id: string; agent: any }) =>
      apiClient.updateAgent(id, agent),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myAgents });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      if (response.data) {
        toast({
          title: "Agent updated",
          description: `${response.data.name} has been updated successfully.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myAgents });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      toast({
        title: "Agent deleted",
        description: "The agent has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============= CONVERSATIONS =============

export function useConversations(
  params?: { status?: "active" | "archived"; page?: number; limit?: number },
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: queryKeys.conversations(params?.status),
    queryFn: () => apiClient.getConversations(params),
    staleTime: 30 * 1000, // 30 seconds - conversations change frequently
    gcTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversation: { agent_id?: string | null; title?: string }) =>
      apiClient.createConversation(conversation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (conversationId: string) =>
      apiClient.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      conversationId,
      status,
    }: {
      conversationId: string;
      status: "active" | "archived";
    }) => apiClient.updateConversationStatus(conversationId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({
        title:
          variables.status === "archived"
            ? "Conversation archived"
            : "Conversation restored",
        description:
          variables.status === "archived"
            ? "The conversation has been archived."
            : "The conversation has been restored to active list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============= MESSAGES =============

export function useMessages(
  conversationId: string,
  page?: number,
  limit?: number,
) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId, page),
    queryFn: () => apiClient.getMessages(conversationId, page, limit),
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds - messages change frequently
    gcTime: 2 * 60 * 1000,
  });
}

// ============= USAGE & ANALYTICS =============

export function useUsageStats(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: queryKeys.usageStats(params?.start_date, params?.end_date),
    queryFn: () => apiClient.getUsageStats(params),
    staleTime: 60 * 1000, // 1 minute - stats don't change rapidly
    gcTime: 10 * 60 * 1000,
  });
}

export function useUsageLogs(params?: {
  start_date?: string;
  end_date?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: queryKeys.usageLogs(params),
    queryFn: () => apiClient.getUsageLogs(params),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============= DEEP ANALYTICS / THINKERS =============

export function useSessionDetails(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessionDetails(sessionId),
    queryFn: () => apiClient.getSessionDetails(sessionId),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes - session details are static
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on backend database errors (500 with "coerce" message)
      if (
        error?.message?.includes("coerce") ||
        error?.message?.includes("Cannot coerce")
      ) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: 2000, // Wait 2 seconds between retries
  });
}

export function useSessions(params?: { limit?: number; page?: number }) {
  return useQuery({
    queryKey: queryKeys.sessions(params),
    queryFn: () => apiClient.getSessions(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000,
  });
}

// ============= AUTH =============

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: false, // Don't retry on 401
  });
}

// ============= BLOGS =============

export function useBlogTopics() {
  return useQuery({
    queryKey: queryKeys.blogTopics,
    queryFn: async () => {
      const res = await getTopics();
      return res || [];
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useInfiniteBlogs(
  topic?: string,
  search?: string,
  limit: number = 12,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.blogs(topic, search),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getBlogs({
        page: pageParam,
        limit,
        topic,
        search,
      });
      return {
        data: res.data || [],
        nextPage:
          res.meta && res.meta.page < res.meta.totalPages
            ? pageParam + 1
            : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 500 * 60 * 1000, // 500 minutes cache to prevent unnecessary refetches
    placeholderData: keepPreviousData, // Keeps old data visible while fetching new filters/pages
  });
}

export function useBlog(slug?: string) {
  return useQuery({
    queryKey: queryKeys.blog(slug!),
    queryFn: async () => {
      if (!slug) throw new Error("No slug provided");
      const d = await getBlog(slug);
      if (!d) throw new Error("Article not found");
      return d;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

// ============= NEWSLETTER =============

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: (email: string) => subscribeNewsletter(email),
  });
}

// ============= NOTIFICATION PREFERENCES =============

export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: async () => {
      const response = await apiClient.getNotificationPreferences();
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    gcTime: 24 * 60 * 60 * 1000, // Keep in garbage collection for 24 hours
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: {
      email_weekly_digest?: boolean;
      email_problem_alerts?: boolean;
      email_product_updates?: boolean;
      email_marketing?: boolean;
    }) => {
      const response = await apiClient.updateNotificationPreferences(preferences);
      if (!response.success) {
        throw new Error("Failed to update preferences");
      }
      return response.data;
    },
    // When mutate is called:
    onMutate: async (newPrefs) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationPreferences });

      // Snapshot the previous value
      const previousPrefs = queryClient.getQueryData(queryKeys.notificationPreferences);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.notificationPreferences, (old: any) => ({
        ...old,
        ...newPrefs,
      }));

      // Return a context object with the snapshotted value
      return { previousPrefs };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newPrefs, context: any) => {
      queryClient.setQueryData(queryKeys.notificationPreferences, context.previousPrefs);
      toast({
        title: "Failed to update preferences",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationPreferences });
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your notification settings have been saved.",
      });
    },
  });
}
