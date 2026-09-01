export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-4">
      {/* Corak hiasan */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.35) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(37,99,235,0.3) 0, transparent 45%)",
        }}
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
