// Coruja do Corujão — SVG inline (sem arquivo externo). Aceita size/className como
// um ícone comum, pra usar tanto na sidebar quanto no cabeçalho da aba.
export function Coruja({
  size = 24,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={style}
      aria-label="Corujão"
      role="img"
    >
      {/* lua atrás */}
      <path d="M54 14a12 12 0 1 1-9-11 9 9 0 0 0 9 11Z" fill="#f59e0b" opacity="0.9" />
      {/* orelhas */}
      <path d="M15 18l9 8-11 3z" fill="var(--primary)" />
      <path d="M49 18l-9 8 11 3z" fill="var(--primary)" />
      {/* corpo/cabeça */}
      <ellipse cx="32" cy="36" rx="22" ry="23" fill="var(--primary)" />
      {/* barriga */}
      <path d="M32 22c9 0 15 8 15 18s-6 16-15 16-15-6-15-16 6-18 15-18z" fill="#ffffff" opacity="0.14" />
      {/* olhos */}
      <circle cx="23" cy="31" r="10" fill="#fff" />
      <circle cx="41" cy="31" r="10" fill="#fff" />
      <circle cx="23" cy="32" r="4.5" fill="#111827" />
      <circle cx="41" cy="32" r="4.5" fill="#111827" />
      <circle cx="24.6" cy="30.4" r="1.4" fill="#fff" />
      <circle cx="42.6" cy="30.4" r="1.4" fill="#fff" />
      {/* bico */}
      <path d="M32 36l4 6h-8z" fill="#f59e0b" />
      {/* pés */}
      <path d="M26 58l-2 4M32 59v4M38 58l2 4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
