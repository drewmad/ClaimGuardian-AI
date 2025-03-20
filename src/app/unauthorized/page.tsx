import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center flex-shrink-0 w-16 h-16 mx-auto mb-5 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V9m0 0V7m0 2h2m-2 0H9m9 5a7 7 0 110-14 7 7 0 010 14z"></path>
            </svg>
          </div>
          
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Access Denied</h2>
          <p className="mt-4 text-md text-gray-600">
            You don't have permission to access this page. 
            This might be because you don't have the necessary role or permissions.
          </p>
          
          <div className="mt-8 space-y-4">
            <Link 
              href="/dashboard" 
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>
            
            <p className="text-gray-500 text-sm">
              If you believe this is an error, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 