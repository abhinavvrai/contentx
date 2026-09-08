export default function Home() {
  return (
    <main className="site-frame-shell">
      <iframe
        className="site-frame"
        src="/site/index.html?v=frame-native-18"
        title="Content X"
        allow="microphone 'self'; fullscreen 'self'; picture-in-picture 'self'"
      />
    </main>
  );
}
