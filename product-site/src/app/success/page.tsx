import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 gap-4">
      <h1 className="text-3xl font-semibold">Payment successful ✅</h1>
      <p className="text-neutral-600 max-w-xl">
        We’ve sent your secure download link to your email. It may take a minute to arrive. If you don’t see it, check your spam folder or contact support.
      </p>
      <Link className="text-blue-600 hover:underline" href="/">Back to home</Link>
    </div>
  );
}