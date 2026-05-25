 
import { ScrollText, AlertCircle, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Props {
  logs: any[];
  loading: boolean;
  error: string | null;
  getTypeBadgeStyles: (t: any) => string;
  getTypeIcon: (t: any) => React.ReactNode;
  getCategoryLabel: (c: any) => string;
  onFetch: () => void;
}

export default function LogsList({ logs, loading, error, getTypeBadgeStyles, getTypeIcon, getCategoryLabel, onFetch }: Props) {
  return (
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
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4">
                    <div className="hidden md:block h-4 bg-muted rounded w-24" />
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
              <tr>
                <td colSpan={5} className="p-8 text-center text-rose-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="size-8" />
                    <p className="font-semibold">Failed to load logs</p>
                    <p className="text-xs text-muted-foreground max-w-md">{error}</p>
                    <Button variant="outline" size="sm" onClick={onFetch} className="mt-2">Try Again</Button>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <ScrollText className="size-10 text-muted-foreground/40" />
                    <div>
                      <p className="font-medium text-foreground">No matching logs found</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">Try adjusting search terms or category filters to locate specific system traces.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const createdAt = new Date(log.created_at);
                const isHighlighted = (log as any).isNew;

                return (
                  <tr key={log.id} className={`hover:bg-muted/40 transition-colors duration-1000 ${isHighlighted ? 'bg-amber-500/10 dark:bg-amber-500/5 font-medium' : ''}`}>
                    <td className="p-4 text-xs align-top">
                      <div className="hidden md:block font-mono text-muted-foreground whitespace-nowrap">
                        {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
                      </div>

                      <div className="md:hidden flex flex-col gap-2 min-w-31.25">
                        <span className="font-mono font-medium text-muted-foreground whitespace-nowrap">{createdAt.toLocaleDateString()}<br/>{createdAt.toLocaleTimeString()}</span>

                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getTypeBadgeStyles(log.log_type)}`}>
                            {getTypeIcon(log.log_type)}
                            <span className="capitalize">{log.log_type}</span>
                          </span>
                        </div>

                        <div className="text-[10px] font-semibold text-muted-foreground capitalize">
                          <span className="bg-muted px-1.5 py-0.5 rounded">{getCategoryLabel(log.category)}</span>
                        </div>

                        <div>
                          {log.logger ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="size-5 border border-border">
                                <AvatarImage src={log.logger.avatar_url || undefined} />
                                <AvatarFallback className="text-[8px] font-bold bg-muted">{log.logger.first_name[0]}{log.logger.last_name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-[11px] text-foreground truncate max-w-21.25">{log.logger.first_name} {log.logger.last_name[0]}.</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><UserIcon className="size-3" />System Task</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold border ${getTypeBadgeStyles(log.log_type)}`}>
                        {getTypeIcon(log.log_type)}
                        <span className="capitalize">{log.log_type}</span>
                      </span>
                    </td>

                    <td className="p-4 hidden md:table-cell text-xs font-semibold text-muted-foreground capitalize">
                      <span className="bg-muted px-2 py-1 rounded">{getCategoryLabel(log.category)}</span>
                    </td>

                    <td className="p-4 hidden md:table-cell">
                      {log.logger ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7 border border-border">
                            <AvatarImage src={log.logger.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] font-bold bg-muted">{log.logger.first_name[0]}{log.logger.last_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate leading-tight text-xs sm:text-sm">{log.logger.first_name} {log.logger.last_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate uppercase">{log.logger.role}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground"><UserIcon className="size-4" /><span className="text-xs">System Task</span></div>
                      )}
                    </td>

                    <td className="p-4 font-normal text-card-foreground break-all max-w-42.5 sm:max-w-none align-top">{log.log}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
