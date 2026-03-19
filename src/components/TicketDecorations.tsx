export function PaperClip() {
  return (
    <div className="absolute -top-2 right-[30px] h-9 w-5 rotate-[5deg] rounded-[4px_4px_10px_10px] border-2 border-journal-binding" />
  );
}

export function WashiTape() {
  return (
    <div className="absolute -top-1.5 left-5 h-[18px] w-[60px] -rotate-[3deg] rounded-sm bg-green-200/50" />
  );
}

export function PushPin() {
  return (
    <div
      className="absolute right-10 top-[-5px] h-3.5 w-3.5 rounded-full shadow-md"
      style={{ background: 'radial-gradient(circle at 40% 40%, #e88, #c55)' }}
    />
  );
}
