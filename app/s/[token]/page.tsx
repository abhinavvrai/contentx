type SharePageProps = {
  params: Promise<{ token: string }>;
};

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const safeToken = /^[A-Za-z0-9_-]{20,200}$/.test(token) ? token : "";
  const source = safeToken
    ? `/site/index.html?v=frame-native-4#share?token=${encodeURIComponent(safeToken)}`
    : "/site/index.html?v=frame-native-4#share";

  return (
    <main className="site-frame-shell">
      <iframe className="site-frame" src={source} title="Content X shared review" />
    </main>
  );
}
