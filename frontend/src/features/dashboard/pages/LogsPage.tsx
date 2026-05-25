import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuditLogs, type AuditLog, type LogCategory, type LogType } from '@/api/audit';
import { Button } from '@/components/ui/button';
import LogsToolbar from '@/features/dashboard/components/logs/LogsToolbar';
import LogsList from '@/features/dashboard/components/logs/LogsList';

const CATEGORIES: { value: LogCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'authentication', label: 'Authentication' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'recipe', label: 'Recipe' },
  { value: 'category', label: 'Category' },
  { value: 'product', label: 'Product' },
  { value: 'discount', label: 'Discount' },
  { value: 'order', label: 'Order' },
  { value: 'inventory', label: 'Inventory' },
];

interface DisplayLog extends AuditLog {
  isNew?: boolean;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<DisplayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keyset pagination states
  const [cursorStack, setCursorStack] = useState<(number | undefined)[]>([]);
  const [currentCursor, setCurrentCursor] = useState<number | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<LogType | 'all'>('all');
  const [searchVal, setSearchVal] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Socket & Stream Control
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Debouncing search val
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchVal);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchVal]);

  // Reset cursors on search or filter change
  useEffect(() => {
    setCurrentCursor(undefined);
    setCursorStack([]);
  }, [categoryFilter, typeFilter, searchDebounced]);

  // Fetch static logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs({
        category: categoryFilter,
        type: typeFilter,
        search: searchDebounced,
        cursor: currentCursor,
        limit: 20,
      });
      setLogs(data.items);
      setNextCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, typeFilter, searchDebounced, currentCursor]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle Socket live injection
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const socketUrl = baseURL.replace('/api/v1', '');

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit('join_admin_logs');
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on('new_audit_log', (newLog: AuditLog) => {
      // Avoid injecting if live feed is paused or we are not on the first page
      if (isLivePaused || currentCursor !== undefined) return;

      // Filter check on incoming socket log
      if (categoryFilter !== 'all' && newLog.category !== categoryFilter) return;
      if (typeFilter !== 'all' && newLog.log_type !== typeFilter) return;
      if (searchDebounced) {
        const query = searchDebounced.toLowerCase();
        const matchesLog = newLog.log.toLowerCase().includes(query);
        const matchesActor = newLog.logger
          ? `${newLog.logger.first_name} ${newLog.logger.last_name} ${newLog.logger.username}`
              .toLowerCase()
              .includes(query)
          : false;

        if (!matchesLog && !matchesActor) return;
      }

      // Prepend live log and trigger fade-in flash
      const logWithFlash: DisplayLog = { ...newLog, isNew: true };
      setLogs((prev) => {
        // Cap list at 20 items to match page size
        const updated = [logWithFlash, ...prev];
        if (updated.length > 20) {
          updated.pop();
        }
        return updated;
      });

      // Fade-out flash highlights after 3 seconds
      setTimeout(() => {
        setLogs((prev) =>
          prev.map((l) => (l.id === newLog.id ? { ...l, isNew: false } : l))
        );
      }, 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, [categoryFilter, typeFilter, searchDebounced, currentCursor, isLivePaused]);

  // Log Type badge style generators
  const getTypeBadgeStyles = (type: LogType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'warn':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'error':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400';
      case 'info':
      default:
        return 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400';
    }
  };

  // Log Type Icon generators
  const getTypeIcon = (type: LogType) => {
    const sizeClass = 'size-4 shrink-0';
    switch (type) {
      case 'success':
        return <CheckCircle2 className={`${sizeClass} text-emerald-500`} />;
      case 'warn':
        return <AlertTriangle className={`${sizeClass} text-amber-500`} />;
      case 'error':
        return <AlertCircle className={`${sizeClass} text-rose-500`} />;
      case 'info':
      default:
        return <Info className={`${sizeClass} text-sky-500`} />;
    }
  };

  const getCategoryLabel = (cat: LogCategory) => {
    const matched = CATEGORIES.find((c) => c.value === cat);
    return matched ? matched.label : cat;
  };

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-400 mx-auto">
      <LogsToolbar
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        isSocketConnected={isSocketConnected}
        isLivePaused={isLivePaused}
        setIsLivePaused={setIsLivePaused}
        onRefresh={fetchLogs}
        loading={loading}
      />

      <LogsList
        logs={logs}
        loading={loading}
        error={error}
        getTypeBadgeStyles={getTypeBadgeStyles}
        getTypeIcon={getTypeIcon}
        getCategoryLabel={getCategoryLabel}
        onFetch={fetchLogs}
      />

        {/* Pagination Footer */}
        {(cursorStack.length > 0 || hasNextPage) && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-3 select-none">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {cursorStack.length > 0 ? (
                <span>Viewing page <span className="font-semibold">{cursorStack.length + 1}</span></span>
              ) : (
                <span>Viewing latest logs</span>
              )}
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2.5"
                onClick={() => {
                  const prevStack = [...cursorStack];
                  const targetCursor = prevStack.pop();
                  setCursorStack(prevStack);
                  setCurrentCursor(targetCursor);
                }}
                disabled={cursorStack.length === 0}
              >
                <ChevronLeft className="size-3.5 mr-1" /> Previous
              </Button>
              
              <span className="text-xs sm:text-sm font-medium px-2">
                Page {cursorStack.length + 1}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2.5"
                onClick={() => {
                  if (nextCursor) {
                    setCursorStack((stack) => [...stack, currentCursor]);
                    setCurrentCursor(nextCursor);
                  }
                }}
                disabled={!hasNextPage || !nextCursor}
              >
                Next <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
  );
}
