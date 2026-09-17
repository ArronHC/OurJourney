'use client';

import { useMemo, useState } from 'react';
import type { AuthStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'login' | 'register';

export default function AuthScreen({ status }: { status: AuthStatus }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>(status.can_register_without_invite ? 'register' : 'login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [form, setForm] = useState({
    email: '',
    display_name: '',
    password: '',
    invite_code: '',
  });

  const registerLocked = useMemo(
    () => status.user_count >= 2 && !status.can_register_without_invite,
    [status.can_register_without_invite, status.user_count]
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          email: form.email,
          display_name: form.display_name,
          password: form.password,
          invite_code: form.invite_code || undefined,
        });
      }
      setMessage({ type: 'success', text: '认证成功，正在进入你们的旅程页面...' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '操作失败，请重试',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fffdf8,transparent_40%),linear-gradient(180deg,#f7efe4_0%,#f0e8dc_100%)] px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-journal-border/80 bg-journal-paper p-8 shadow-[0_30px_80px_rgba(118,89,65,0.12)]">
            <div className="inline-block rounded-full border border-journal-gold/70 px-4 py-1 text-[11px] tracking-[4px] text-journal-text-muted">
              OUR JOURNEY
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-journal-text">
              先登录，再把这本只属于你们的手帐打开。
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-journal-text-secondary">
              第一个人注册后，可以生成邀请码邀请伴侣加入。完成后，两个人共用同一份旅程记录、票据识别和足迹地图。
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['1', '创建账号', '第一位用户可以直接注册'],
                ['2', '生成邀请码', '登录后生成专属邀请码'],
                ['3', '伴侣加入', '第二位用户凭邀请码注册'],
              ].map(([step, title, desc]) => (
                <div
                  key={step}
                  className="rounded-2xl border border-journal-border bg-[#fbf6ef] p-4"
                >
                  <div className="text-sm font-bold text-journal-accent">STEP {step}</div>
                  <div className="mt-2 text-base font-semibold text-journal-text">{title}</div>
                  <div className="mt-1 text-sm text-journal-text-secondary">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-journal-border/80 bg-white/90 p-7 shadow-[0_25px_70px_rgba(118,89,65,0.1)] backdrop-blur">
            <div className="grid grid-cols-2 rounded-2xl bg-[#f6ede1] p-1.5">
              <button
                onClick={() => setMode('login')}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-journal-accent shadow-sm'
                    : 'text-journal-text-secondary'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => !registerLocked && setMode('register')}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-white text-journal-accent shadow-sm'
                    : 'text-journal-text-secondary'
                } ${registerLocked ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                注册
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-[11px] text-journal-text-muted">昵称</label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, display_name: event.target.value }))
                    }
                    className="w-full rounded-xl border border-journal-border bg-[#faf5ee] px-4 py-3 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
                    placeholder="比如：Arron"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] text-journal-text-muted">邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full rounded-xl border border-journal-border bg-[#faf5ee] px-4 py-3 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-journal-text-muted">密码</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="w-full rounded-xl border border-journal-border bg-[#faf5ee] px-4 py-3 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
                  placeholder="至少 8 位"
                />
              </div>

              {mode === 'register' && !status.can_register_without_invite && !registerLocked && (
                <div>
                  <label className="mb-1 block text-[11px] text-journal-text-muted">
                    邀请码
                  </label>
                  <input
                    type="text"
                    value={form.invite_code}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, invite_code: event.target.value.toUpperCase() }))
                    }
                    className="w-full rounded-xl border border-journal-border bg-[#faf5ee] px-4 py-3 text-sm font-serif uppercase tracking-[2px] text-journal-text focus:border-journal-accent focus:outline-none"
                    placeholder="输入伴侣发给你的邀请码"
                  />
                </div>
              )}
            </div>

            {registerLocked && mode === 'register' && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                当前两位伴侣账号都已创建，如需进入请直接登录。
              </div>
            )}

            {message && (
              <div
                className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (registerLocked && mode === 'register')}
              className="mt-6 w-full rounded-2xl bg-gradient-to-br from-journal-accent to-[#d4946e] py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : mode === 'login' ? '登录进入' : '注册并进入'}
            </button>

            <p className="mt-4 text-center text-xs leading-6 text-journal-text-muted">
              {status.can_register_without_invite
                ? '当前还没有账号，第一个人可以直接注册。'
                : status.user_count === 1
                  ? '已有一位用户注册，第二位用户需要邀请码。'
                  : '已进入双人模式，未登录用户只能使用已有账号登录。'}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
