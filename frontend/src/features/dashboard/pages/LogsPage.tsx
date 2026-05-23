import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  ScrollText, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  Pause, 
  Play, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  User as UserIcon,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getAuditLogs, type AuditLog, type LogCategory, type LogType } from '@/api/audit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const TYPES: { value: LogType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warn', label: 'Warning' },
  { value: 'error', label: 'Error' },
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
      {/* Header and Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor and trace system-wide operations, order entries, inventory audits, and security actions in real time.
          </p>
        </div>

        {/* Live / WebSocket status indicator */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all ${
            isSocketConnected 
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'border-muted-foreground/20 bg-muted text-muted-foreground'
          }`}>
            {isSocketConnected ? (
              <>
                <Wifi className="size-3.5 animate-pulse" />
                Live Stream Active
              </>
            ) : (
              <>
                <WifiOff className="size-3.5" />
                Offline Feed
              </>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsLivePaused((v) => !v)}
            className="h-8 text-xs font-medium"
          >
            {isLivePaused ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Play className="size-3.5 fill-current" /> Resume Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Pause className="size-3.5 fill-current" /> Pause Live
              </span>
            )}
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchLogs} 
            className="size-8"
            disabled={loading}
            aria-label="Refresh logs"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter and Query Dashboard */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search log messages or actor names..."
            className="pl-9 w-full"
          />
        </div>

        {/* Categories Dropdown */}
        <div className="relative min-w-45">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as LogCategory | 'all');
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-card-foreground cursor-pointer dark:bg-card"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-background text-foreground">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severities Dropdown */}
        <div className="relative min-w-45">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as LogType | 'all');
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-card-foreground cursor-pointer dark:bg-card"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-background text-foreground">
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground select-none">
                <th className="p-4 w-41.25 md:w-45">
                  <span className="md:hidden">Log Info</span>
                  <span className="hidden md:inline">Timestamp</span>
                </th>
                <th className="p-4 w-25 hidden md:table-cell">Severity</th>
                <th className="p-4 w-35 hidden md:table-cell">Category</th>
                <th className="p-4 w-50 hidden md:table-cell">Actor</th>
                <th className="p-4">Log Entry Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && logs.length === 0 ? (
                // Skeleton UI Loader
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4">
                      {/* Desktop skeleton */}
                      <div className="hidden md:block h-4 bg-muted rounded w-24" />
                      {/* Mobile loader stack */}
                      <div className="md:hidden flex flex-col gap-2">
                        <div className="h-3 bg-muted rounded w-20" />
                        <div className="h-5 bg-muted rounded-full w-14" />
                        <div className="h-4 bg-muted rounded w-16" />
                        <div className="h-3 bg-muted rounded w-16" />
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell"><div className="h-6 bg-muted rounded-full w-16" /></td>
                    <td className="p-4 hidden md:table-cell"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-muted" />
                        <div className="h-4 bg-muted rounded w-24" />
                      </div>
                    </td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-[80%]" /></td>
                  </tr>
                ))
              ) : error ? (
                // Error Alert State
                <tr>
                  <td colSpan={5} className="p-8 text-center text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="size-8" />
                      <p className="font-semibold">Failed to load logs</p>
                      <p className="text-xs text-muted-foreground max-w-md">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchLogs} className="mt-2">
                        Try Again
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                // Clean Empty State
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ScrollText className="size-10 text-muted-foreground/40" />
                      <div>
                        <p className="font-medium text-foreground">No matching logs found</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                          Try adjusting search terms or category filters to locate specific system traces.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data mapping
                logs.map((log) => {
                  const createdAt = new Date(log.created_at);
                  const isHighlighted = log.isNew;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-muted/40 transition-colors duration-1000 ${
                        isHighlighted 
                          ? 'bg-amber-500/10 dark:bg-amber-500/5 font-medium' 
                          : ''
                      }`}
                    >
                      {/* Responsive Metadata Stack / Timestamp */}
                      <td className="p-4 text-xs align-top">
                        {/* Desktop: standard single line timestamp */}
                        <div className="hidden md:block font-mono text-muted-foreground whitespace-nowrap">
                          {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
                        </div>

                        {/* Mobile: Stacked multi-field metadata context */}
                        <div className="md:hidden flex flex-col gap-2 min-w-31.25">
                          {/* Timestamp */}
                          <span className="font-mono font-medium text-muted-foreground whitespace-nowrap">
                            {createdAt.toLocaleDateString()}<br/>
                            {createdAt.toLocaleTimeString()}
                          </span>

                          {/* Severity badge */}
                          <div>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getTypeBadgeStyles(log.log_type)}`}>
                              {getTypeIcon(log.log_type)}
                              <span className="capitalize">{log.log_type}</span>
                            </span>
                          </div>

                          {/* Category pill */}
                          <div className="text-[10px] font-semibold text-muted-foreground capitalize">
                            <span className="bg-muted px-1.5 py-0.5 rounded">
                              {getCategoryLabel(log.category)}
                            </span>
                          </div>

                          {/* Actor stack */}
                          <div>
                            {log.logger ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="size-5 border border-border">
                                  <AvatarImage src={log.logger.avatar_url || undefined} />
                                  <AvatarFallback className="text-[8px] font-bold bg-muted">
                                    {log.logger.first_name[0]}{log.logger.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-[11px] text-foreground truncate max-w-21.25">
                                  {log.logger.first_name} {log.logger.last_name[0]}.
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                                <UserIcon className="size-3" />
                                <span>System Task</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Severity (desktop only) */}
                      <td className="p-4 whitespace-nowrap hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold border ${getTypeBadgeStyles(log.log_type)}`}>
                          {getTypeIcon(log.log_type)}
                          <span className="capitalize">{log.log_type}</span>
                        </span>
                      </td>

                      {/* Category (desktop only) */}
                      <td className="p-4 hidden md:table-cell text-xs font-semibold text-muted-foreground capitalize">
                        <span className="bg-muted px-2 py-1 rounded">
                          {getCategoryLabel(log.category)}
                        </span>
                      </td>

                      {/* Actor (desktop only) */}
                      <td className="p-4 hidden md:table-cell">
                        {log.logger ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7 border border-border">
                              <AvatarImage src={log.logger.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px] font-bold bg-muted">
                                {log.logger.first_name[0]}{log.logger.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate leading-tight text-xs sm:text-sm">
                                {log.logger.first_name} {log.logger.last_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate uppercase">
                                {log.logger.role}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <UserIcon className="size-4" />
                            <span className="text-xs">System Task</span>
                          </div>
                        )}
                      </td>

                      {/* Message details */}
                      <td className="p-4 font-normal text-card-foreground break-all max-w-42.5 sm:max-w-none align-top">
                        {log.log}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
    </div>
  );
}
