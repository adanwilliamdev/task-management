import type { ReactNode } from 'react';
import { IconCheck, Logo } from './Icons';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Painel de marca */}
      <section className="relative hidden overflow-hidden border-r border-white/[0.06] lg:block">
        <div className="anim-float absolute -left-24 top-24 h-80 w-80 rounded-full bg-iris-500/25 blur-[90px]" />
        <div
          className="anim-float absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-mint-400/15 blur-[90px]"
          style={{ animationDelay: '-4s' }}
        />
        <div className="relative flex h-full flex-col justify-between p-14">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <span className="font-display text-2xl font-bold tracking-tight">TaskFlow</span>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
              Menos ruído.
              <br />
              Mais tarefas concluídas.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-fog-300">
              Organize o que importa em um quadro simples e arraste cada tarefa até o fim.
            </p>

            {/* Mini prévia do quadro */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { label: 'A fazer', color: 'bg-sky-soft', done: false },
                { label: 'Em progresso', color: 'bg-sun-400', done: false },
                { label: 'Concluída', color: 'bg-mint-400', done: true },
              ].map((c, i) => (
                <div key={c.label} className="surface p-3" style={{ transform: `translateY(${i * 10}px)` }}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-fog-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.color}`} />
                    {c.label}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 rounded-full bg-white/10" />
                    <div className="h-2 w-2/3 rounded-full bg-white/[0.06]" />
                    {c.done && (
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-mint-400/20 text-mint-400">
                        <IconCheck className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-fog-500">Seu trabalho, em fluxo.</p>
        </div>
      </section>

      {/* Formulário */}
      <section className="flex items-center justify-center px-5 py-12">
        <div className="anim-pop w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="font-display text-xl font-bold tracking-tight">TaskFlow</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-fog-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  );
}
