import * as React from "react";

export function FormLabel({
  children,
  htmlFor,
  required,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 ${className}`}
    >
      {children}
      {required && <span className="text-rose-400 ml-1 font-sans">*</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-mono">
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </p>
  );
}

export function FormHelperText({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-text-tertiary mt-1 leading-normal">{children}</p>;
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3.5 py-2 rounded-xl bg-[#121724] border text-white placeholder-text-tertiary text-xs transition-colors focus:outline-none focus:ring-1 ${
          error
            ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30"
            : "border-white/10 hover:border-white/20 focus:border-primary focus:ring-primary/30"
        } ${className}`}
        {...props}
      />
    );
  }
);
FormInput.displayName = "FormInput";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#121724] border text-white placeholder-text-tertiary text-xs transition-colors focus:outline-none focus:ring-1 resize-y ${
          error
            ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30"
            : "border-white/10 hover:border-white/20 focus:border-primary focus:ring-primary/30"
        } ${className}`}
        {...props}
      />
    );
  }
);
FormTextarea.displayName = "FormTextarea";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className = "", error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-3.5 py-2 rounded-xl bg-[#121724] border text-white text-xs transition-colors focus:outline-none focus:ring-1 ${
          error
            ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30"
            : "border-white/10 hover:border-white/20 focus:border-primary focus:ring-primary/30"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
FormSelect.displayName = "FormSelect";

export function FormCheckbox({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded bg-[#121724] border border-white/20 text-primary focus:ring-primary focus:ring-offset-0 focus:ring-1 checked:bg-primary"
      />
      <div>
        <span className="text-xs font-medium text-white group-hover:text-primary transition-colors block">
          {label}
        </span>
        {description && <span className="text-[11px] text-text-tertiary block mt-0.5">{description}</span>}
      </div>
    </label>
  );
}
