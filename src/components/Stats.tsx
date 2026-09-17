'use client';

import { useStats } from '@/hooks/useMeetings';
import EmptyState from './EmptyState';
import ScrollFadeIn from './ScrollFadeIn';

export default function Stats() {
  const { stats, isLoading } = useStats();

  const cards = stats
    ? [
        {
          icon: '💑',
          value: stats.meeting_count.toString(),
          label: '见面次数',
          sub: `平均每月 ${stats.avg_monthly_frequency} 次`,
          color: 'text-journal-accent',
        },
        {
          icon: '💰',
          value: `¥${stats.total_cost.toLocaleString()}`,
          label: '总花费',
          sub: `平均 ¥${stats.avg_cost_per_meeting.toLocaleString()}/次`,
          color: 'text-red-500',
        },
        {
          icon: '🌍',
          value: `${stats.total_distance_km.toLocaleString()}km`,
          label: '总里程',
          sub: stats.distance_fun_fact,
          color: 'text-green-600',
        },
        {
          icon: '📅',
          value: `${stats.total_days_together}天`,
          label: '在一起的天数',
          sub: `平均每次 ${stats.avg_days_per_meeting} 天`,
          color: 'text-indigo-600',
        },
      ]
    : [];

  const maxCost = stats ? Math.max(...stats.cost_per_meeting.map((item) => item.cost), 1) : 1;

  return (
    <section
      id="stats"
      className="min-h-screen bg-gradient-to-b from-journal-bg via-[#faf5ee] to-journal-bg px-5 py-20"
    >
      <div className="mx-auto max-w-journal">
        <h2 className="mb-7 text-center text-[22px] font-bold text-journal-text">
          <span className="border-b-2 border-journal-gold pb-1.5">📊 我们的数据</span>
        </h2>

        {isLoading ? (
          <div className="py-16 text-center text-journal-text-muted">加载中...</div>
        ) : !stats || stats.meeting_count === 0 ? (
          <EmptyState
            message="记录你们的第一次见面，数据就会出现在这里"
            action={{ label: '添加记录', target: 'record' }}
          />
        ) : (
          <ScrollFadeIn>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="flex min-h-[190px] min-w-0 flex-col rounded-[14px] border border-journal-border bg-journal-paper p-5 text-center shadow-sm transition-transform hover:-translate-y-1 sm:min-h-[208px] sm:p-6"
                >
                  <div className="mb-2 text-[28px]">{card.icon}</div>
                  <div
                    className={`mx-auto my-1 block max-w-full overflow-hidden text-balance break-words text-[clamp(1.85rem,5vw,2.35rem)] font-bold leading-[1.1] ${card.color}`}
                  >
                    {card.value}
                  </div>
                  <div className="mt-1 text-sm text-journal-text-muted">{card.label}</div>
                  <div
                    className="mt-2 overflow-hidden text-pretty break-words text-xs leading-5 text-journal-text-secondary"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                    }}
                    title={card.sub}
                  >
                    {card.sub}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[14px] border border-journal-border bg-journal-paper p-6 shadow-sm">
              <h3 className="mb-4 text-[15px] font-semibold text-journal-text">
                📈 每次见面花费趋势
              </h3>
              <div className="flex h-[120px] items-end gap-2">
                {stats.cost_per_meeting.map((item, index) => (
                  <div key={item.meeting_id} className="flex flex-1 flex-col items-center gap-1">
                    <div className="text-[10px] font-semibold text-journal-text-secondary">
                      ¥{(item.cost / 1000).toFixed(1)}k
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-journal-gold to-journal-binding transition-colors hover:from-journal-accent hover:to-journal-gold"
                      style={{ height: `${Math.max(4, (item.cost / maxCost) * 100)}px` }}
                    />
                    <div className="text-[10px] text-journal-text-muted">第{index + 1}次</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollFadeIn>
        )}
      </div>
    </section>
  );
}
