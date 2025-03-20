# Florida Insurance Claims Assistant

A comprehensive web application for managing insurance policies, processing claims, and analyzing documents for Florida residents.

## Features

### Core Features
- **User Authentication**: Secure login with multi-factor authentication
- **Policy Management**: Create, view, and manage insurance policies
- **Claims Processing**: File and track insurance claims
- **Document Management**: Upload, categorize, and analyze insurance documents
- **Search & Filtering**: Find policies, claims, and documents quickly
- **Notifications**: Stay updated on policy and claim status changes

### Advanced Features
- **Intelligent Document Analysis**: Automated text extraction from uploaded documents
- **Form Auto-Population**: Intelligent pre-filling of forms based on document analysis
- **Enhanced Security**: Role-based access control, advanced session management
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Cloud Services**: AWS S3 (document storage), AWS Rekognition (document analysis)
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- AWS account with S3 and Rekognition access
- SMTP provider for email notifications

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/florida-insurance-claims.git
cd florida-insurance-claims
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env.local` file with:
```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-random-string
JWT_SECRET=another-secure-random-string

# AWS Services
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Email
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@your-domain.com
```

4. Run database migrations
```bash
npx prisma migrate dev
```

5. Start the development server
```bash
npm run dev
```

6. Visit [http://localhost:3000](http://localhost:3000) in your browser

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- `user-guide.md`: End-user guide for using the application
- `api-documentation.md`: API reference for developers
- `deployment-guide.md`: Guide for deploying to production
- `security-audit-report.md`: Results of security assessment
- `final-checklist.md`: Launch readiness checklist

## Architecture

The application follows a modern web architecture:

- **Next.js Pages & API Routes**: Server-side rendering for performance and SEO
- **React Components**: Reusable UI components organized by feature
- **Prisma Models**: Type-safe database access layer
- **Service Layer**: Business logic organized by domain
- **AWS Integration**: Document storage and analysis services

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the powerful ORM
- Tailwind CSS for the utility-first CSS framework
- AWS for document storage and analysis services