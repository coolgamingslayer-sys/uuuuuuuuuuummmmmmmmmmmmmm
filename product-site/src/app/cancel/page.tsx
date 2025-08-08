import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 gap-4">
      <h1 className="text-3xl font-semibold">Checkout canceled</h1>
      <p className="text-neutral-600 max-w-xl">
        No charge was made. You can try again any time.
      </p>
      <Link className="text-blue-600 hover:underline" href="/">Return to home</Link>
    </div>
  );
}