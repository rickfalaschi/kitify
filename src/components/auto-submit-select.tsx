"use client";

export function AutoSubmitSelect({
  name,
  defaultValue,
  className,
  children,
}: {
  name: string;
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => {
        const form = e.currentTarget.closest("form");
        if (form) form.requestSubmit();
      }}
      className={className}
    >
      {children}
    </select>
  );
}
