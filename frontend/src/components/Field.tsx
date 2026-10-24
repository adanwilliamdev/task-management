import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

export const fieldClass =
  'w-full border border-board-700 bg-board-900 px-3 py-2 text-ink-100 outline-none transition-colors placeholder:text-ink-500 focus:border-amber-400 disabled:opacity-60';

interface FieldProps {
  label: string;
  hint?: string;
  /** Recebe o id gerado para ligar o <label> ao controle. */
  children: (id: string) => ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink-300">
        {label}
      </label>
      {children(id)}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      )}
    </div>
  );
}

interface BaseProps {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <input id={id} className={fieldClass} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />}
    </Field>
  );
}

export function TextArea({ label, hint, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <textarea id={id} className={fieldClass} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />}
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  children,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select id={id} className={fieldClass} aria-describedby={hint ? `${id}-hint` : undefined} {...props}>
          {children}
        </select>
      )}
    </Field>
  );
}
