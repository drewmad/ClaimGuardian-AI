import Link from 'next/link';

export default function VerificationSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verified</h2>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-16 h-16 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <p className="mt-4 text-md text-gray-600">
            Your email address has been successfully verified. Your account is now active.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/login"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Proceed to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 