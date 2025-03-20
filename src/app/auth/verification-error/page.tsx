import Link from 'next/link';

export default function VerificationErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Get the error message based on the error code
  const getErrorMessage = () => {
    switch (searchParams.error) {
      case 'missing-params':
        return 'Missing verification parameters. Please check the link in your email.';
      case 'invalid-token':
        return 'Invalid or expired verification token. Please request a new verification link.';
      case 'server-error':
        return 'A server error occurred while verifying your email. Please try again later.';
      default:
        return 'An error occurred during email verification.';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verification Failed</h2>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-16 h-16 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          </div>
          <p className="mt-4 text-md text-gray-600">
            {getErrorMessage()}
          </p>
          <div className="mt-8 space-y-4">
            <Link
              href="/auth/resend-verification"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Resend Verification Email
            </Link>
            <Link
              href="/auth/login"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 