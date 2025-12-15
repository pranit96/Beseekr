// hooks/use-research-socket.ts - React Hook for Research Socket Events
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import socketService from '@/services/socketService';
import { createLogger } from '@/services/logging';

const logger = createLogger('useResearchSocket');

// ============================================================================
// TYPES
// ============================================================================
export interface ResearchCompleteEvent {
    job_id: string;
    problem_id: string;
    problem_title: string;
    report_id: string;
    status: 'completed';
    message: string;
}

export interface ResearchFailedEvent {
    job_id: string;
    problem_id: string;
    problem_title: string;
    status: 'failed';
    error: string;
    message: string;
}

export interface UseResearchSocketOptions {
    autoNavigate?: boolean;
    showToasts?: boolean;
    problemId?: string; // Filter events for specific problem
}

export interface UseResearchSocketReturn {
    isConnected: boolean;
    lastEvent: ResearchCompleteEvent | ResearchFailedEvent | null;
    pendingJobs: Map<string, { problemId: string; startedAt: number }>;
}

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================
const PENDING_JOBS_KEY = 'research_pending_jobs';

function getPendingJobs(): Map<string, { problemId: string; startedAt: number }> {
    try {
        const stored = localStorage.getItem(PENDING_JOBS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const map = new Map<string, { problemId: string; startedAt: number }>();
            // Filter out stale jobs (older than 15 minutes)
            const now = Date.now();
            Object.entries(parsed).forEach(([jobId, data]: [string, any]) => {
                if (now - data.startedAt < 15 * 60 * 1000) {
                    map.set(jobId, data);
                }
            });
            return map;
        }
    } catch {
        localStorage.removeItem(PENDING_JOBS_KEY);
    }
    return new Map();
}

function savePendingJobs(jobs: Map<string, { problemId: string; startedAt: number }>) {
    const obj: Record<string, { problemId: string; startedAt: number }> = {};
    jobs.forEach((value, key) => {
        obj[key] = value;
    });
    localStorage.setItem(PENDING_JOBS_KEY, JSON.stringify(obj));
}

function removePendingJob(jobId: string) {
    const jobs = getPendingJobs();
    jobs.delete(jobId);
    savePendingJobs(jobs);
}

export function addPendingJob(jobId: string, problemId: string) {
    const jobs = getPendingJobs();
    jobs.set(jobId, { problemId, startedAt: Date.now() });
    savePendingJobs(jobs);
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
export function useResearchSocket(options: UseResearchSocketOptions = {}): UseResearchSocketReturn {
    const { autoNavigate = true, showToasts = true, problemId } = options;
    const navigate = useNavigate();

    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<ResearchCompleteEvent | ResearchFailedEvent | null>(null);
    const [pendingJobs, setPendingJobs] = useState(() => getPendingJobs());

    const handlersRegisteredRef = useRef(false);

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    const handleResearchComplete = useCallback((data: ResearchCompleteEvent) => {
        logger.info('✅ [ResearchSocket] Research complete event received', {
            jobId: data.job_id,
            problemId: data.problem_id,
            reportId: data.report_id,
        });

        // Filter by problemId if specified
        if (problemId && data.problem_id !== problemId) {
            logger.debug('Ignoring event for different problem', {
                expectedProblemId: problemId,
                receivedProblemId: data.problem_id
            });
            return;
        }

        setLastEvent(data);
        removePendingJob(data.job_id);
        setPendingJobs(getPendingJobs());

        // Show toast notification
        if (showToasts) {
            toast.success('Deep research complete!', {
                description: `Analysis ready for "${data.problem_title}"`,
                action: {
                    label: 'View Report',
                    onClick: () => navigate(`/dashboard/research/${data.report_id}`),
                },
                duration: 10000,
            });
        }

        // Auto-navigate to the report
        if (autoNavigate) {
            navigate(`/dashboard/research/${data.report_id}`);
        }
    }, [navigate, autoNavigate, showToasts, problemId]);

    const handleResearchFailed = useCallback((data: ResearchFailedEvent) => {
        logger.error('❌ [ResearchSocket] Research failed event received', {
            jobId: data.job_id,
            problemId: data.problem_id,
            error: data.error,
        });

        // Filter by problemId if specified
        if (problemId && data.problem_id !== problemId) {
            return;
        }

        setLastEvent(data);
        removePendingJob(data.job_id);
        setPendingJobs(getPendingJobs());

        // Show error toast
        if (showToasts) {
            toast.error('Research failed', {
                description: data.error || data.message || 'Please try again later',
                duration: 8000,
            });
        }
    }, [showToasts, problemId]);

    // ============================================================================
    // SOCKET CONNECTION & EVENT REGISTRATION
    // ============================================================================
    useEffect(() => {
        // Check initial connection state
        setIsConnected(socketService.isConnected());

        // Connection status handler
        const handleConnectionStatus = (status: { connected: boolean }) => {
            logger.debug('Connection status changed', { connected: status.connected });
            setIsConnected(status.connected);
        };

        // Register connection listener
        socketService.on('connection_status', handleConnectionStatus);

        // Try to connect if not already
        if (!socketService.isConnected()) {
            try {
                socketService.connect();
            } catch (error) {
                logger.warn('Failed to connect socket', { error });
            }
        }

        // Register research event handlers (only once)
        if (!handlersRegisteredRef.current) {
            logger.info('🔌 [ResearchSocket] Registering event handlers');
            socketService.on('research:complete', handleResearchComplete);
            socketService.on('research:failed', handleResearchFailed);
            handlersRegisteredRef.current = true;
        }

        // Cleanup on unmount
        return () => {
            logger.debug('Cleaning up research socket handlers');
            socketService.off('connection_status', handleConnectionStatus);
            socketService.off('research:complete', handleResearchComplete);
            socketService.off('research:failed', handleResearchFailed);
            handlersRegisteredRef.current = false;
        };
    }, [handleResearchComplete, handleResearchFailed]);

    // ============================================================================
    // RETURN
    // ============================================================================
    return {
        isConnected,
        lastEvent,
        pendingJobs,
    };
}

export default useResearchSocket;
