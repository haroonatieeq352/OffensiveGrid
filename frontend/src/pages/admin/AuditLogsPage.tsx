import React, { useState, useEffect } from 'react';
import { Shield, Search, FileText, Clock, RefreshCw, Eye } from 'lucide-react';
import { auditService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getLogs({ search: searchQuery });
      const list = (data as any).results || (data as any).data || data;
      setLogs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Security & System Audit Trails
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tamper-evident logs of all administrative actions, scoring modifications, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchLogs} leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}>
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-indigo-500/25 bg-slate-100 dark:bg-[#111728] text-[11px] font-mono font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider shadow-2xs">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Actor User</th>
                <th className="py-3.5 px-6">Action Event</th>
                <th className="py-3.5 px-6">Resource</th>
                <th className="py-3.5 px-6">IP Address</th>
                <th className="py-3.5 px-6 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[rgba(148,163,184,0.05)] text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-100/90 dark:hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{log.username}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-500 font-mono">{log.user_email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700 dark:text-slate-400 font-mono font-semibold">
                      {log.resource_type}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-500 font-mono font-medium">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          description={`Logged at ${new Date(selectedLog.created_at).toLocaleString()}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-[rgba(17,24,39,0.60)] rounded-lg text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300">
              <p><strong>Actor:</strong> {selectedLog.username} ({selectedLog.user_email})</p>
              <p><strong>Resource:</strong> {selectedLog.resource_type} ({selectedLog.resource_id})</p>
              <p><strong>IP Address:</strong> {selectedLog.ip_address || '127.0.0.1'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Event Details (JSON Payload):</p>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
