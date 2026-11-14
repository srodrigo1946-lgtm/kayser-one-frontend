// Foto da Tathy (gestora de tráfego) no lugar do ícone da sidebar.
export function TathyFoto({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/tathy.jpg"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #facc15" }}
    />
  );
}
