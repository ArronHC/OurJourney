'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInvites } from '@/hooks/useInvites';

export default function InviteManager() {
  const { auth } = useAuth();
  const { invites, isLoading, createInvite } = useInvites(Boolean(auth.authenticated));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setIsCreating(true);
    setError('');
    try {
      await createInvite();
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成邀请码失败');
    } finally {
      setIsCreating(false);
    }
  };

  const canCreate = auth.user_count < 2;

  return (
    <div className="rounded-2xl border border-journal-border bg-[#fbf6ef] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-journal-text">伴侣邀请</div>
          <div className="mt-1 text-xs leading-5 text-journal-text-secondary">
            生成邀请码后，把它发给伴侣完成注册。
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={!canCreate || isCreating}
          className="rounded-xl bg-journal-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          {isCreating ? '生成中...' : '生成邀请码'}
        </button>
      </div>

      {!canCreate && (
        <div className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
          两位账号都已创建，无需再生成邀请码。
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <div className="text-xs text-journal-text-muted">正在读取邀请码...</div>
        ) : invites.length === 0 ? (
          <div className="text-xs text-journal-text-muted">还没有生成过邀请码。</div>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between rounded-xl border border-journal-border bg-white px-4 py-3"
            >
              <div>
                <div className="font-mono text-base font-bold tracking-[3px] text-journal-accent">
                  {invite.code}
                </div>
                <div className="mt-1 text-[11px] text-journal-text-muted">
                  创建于 {new Date(invite.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
              <div
                className={`text-xs font-semibold ${
                  invite.used_at ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {invite.used_at
                  ? `已使用${invite.used_by_name ? ` · ${invite.used_by_name}` : ''}`
                  : '待使用'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
