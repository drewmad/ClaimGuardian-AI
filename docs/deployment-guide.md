# Deployment Guide
## Florida Insurance Claims Assistant

This guide provides comprehensive instructions for deploying the Florida Insurance Claims Assistant application to production environments. It covers infrastructure setup, configuration, security considerations, and monitoring.

### Table of Contents
1. [Infrastructure Requirements](#infrastructure-requirements)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [AWS Services Configuration](#aws-services-configuration)
5. [Application Deployment](#application-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Security Configuration](#security-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Disaster Recovery](#backup--disaster-recovery)
10. [Scaling Considerations](#scaling-considerations)

## Infrastructure Requirements

### Hardware Recommendations
- **Web/API Servers**: Minimum 2 vCPUs, 4GB RAM per instance
- **Database**: Minimum 4 vCPUs, 8GB RAM
- **Storage**: 100GB+ SSD for database, 50GB SSD for application servers

### Cloud Provider Options
The application is designed to be cloud-agnostic but has been optimized for AWS. Recommended setup:

- **AWS**:
  - EC2 instances or ECS for application servers
  - RDS for PostgreSQL database
  - S3 for document storage
  - Rekognition for document analysis
  - CloudFront for CDN
  - Route 53 for DNS management

- **Alternative Providers**:
  - Azure: App Service, Azure SQL, Blob Storage
  - Google Cloud: GKE, Cloud SQL, Cloud Storage

### Minimum Requirements for Production
- 2+ application servers for high availability
- Managed PostgreSQL database with replication
- Load balancer
- CDN for static assets
- Secure storage for documents
- Monitoring and logging systems

## Environment Setup

### Setting Up Development Environment
1. Clone the repository
   ```bash
   git clone https://github.com/your-org/florida-insurance-claims.git
   cd florida-insurance-claims
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create `.env.local` file with required environment variables (see [Environment Variables](#environment-variables) section)

4. Run database migrations
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

### Environment Variables
Create a `.env` file for production with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# Authentication
NEXTAUTH_URL=https://your-domain.com
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

# Application Settings
NODE_ENV=production
APP_URL=https://your-domain.com
API_URL=https://api.your-domain.com
```

## Database Setup

### PostgreSQL Setup
1. Create a PostgreSQL database in your chosen environment (AWS RDS recommended)
2. Ensure the database is configured with:
   - PostgreSQL 13+ 
   - SSL enabled
   - Automated backups
   - Appropriate instance size (db.t3.medium minimum for production)

3. Configure security groups to allow access only from application servers

4. Run migrations in production:
   ```bash
   DATABASE_URL=postgresql://username:password@hostname:port/database npx prisma migrate deploy
   ```

### Database Optimization
1. Enable connection pooling
2. Set up proper indexes (already defined in Prisma schema)
3. Configure RDS parameters for performance:
   - `shared_buffers`: 25% of available instance memory
   - `work_mem`: 64MB
   - `maintenance_work_mem`: 256MB
   - `effective_cache_size`: 75% of available instance memory
   - `random_page_cost`: 1.1 (if using SSD storage)

## AWS Services Configuration

### S3 Setup for Document Storage
1. Create a new S3 bucket
   ```bash
   aws s3api create-bucket --bucket your-bucket-name --region us-east-1
   ```

2. Configure bucket policy to restrict public access
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "DenyPublicReadAccess",
         "Effect": "Deny",
         "Principal": "*",
         "Action": ["s3:GetObject"],
         "Resource": ["arn:aws:s3:::your-bucket-name/*"],
         "Condition": {
           "StringNotEquals": {
             "aws:sourceVpce": "your-vpc-endpoint-id"
           }
         }
       }
     ]
   }
   ```

3. Enable default encryption
   ```bash
   aws s3api put-bucket-encryption \
     --bucket your-bucket-name \
     --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
   ```

4. Enable versioning for document history
   ```bash
   aws s3api put-bucket-versioning --bucket your-bucket-name --versioning-configuration Status=Enabled
   ```

### Rekognition Configuration
1. Ensure your AWS account has Rekognition enabled
2. Verify IAM permissions include:
   - `rekognition:DetectText`
   - `rekognition:AnalyzeDocument`

3. No additional setup is required as the application uses the API directly

### IAM Roles and Policies
Create a dedicated IAM role for the application with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectText",
        "rekognition:AnalyzeDocument"
      ],
      "Resource": "*"
    }
  ]
}
```

## Application Deployment

### Docker Deployment
1. Build the Docker image
   ```bash
   docker build -t florida-insurance-claims:latest .
   ```

2. Run the container with environment variables
   ```bash
   docker run -d -p 3000:3000 \
     --name florida-insurance \
     --env-file .env \
     florida-insurance-claims:latest
   ```

### Kubernetes Deployment
1. Apply the Kubernetes configuration
   ```bash
   kubectl apply -f kubernetes/deployment.yaml
   kubectl apply -f kubernetes/service.yaml
   kubectl apply -f kubernetes/ingress.yaml
   ```

2. Set up secrets for environment variables
   ```bash
   kubectl create secret generic app-env \
     --from-literal=DATABASE_URL=postgresql://username:password@hostname:port/database \
     --from-literal=NEXTAUTH_SECRET=your-secure-random-string \
     # Add other environment variables
   ```

### Static Export Deployment (optional)
For static site hosting platforms:

1. Build the application with static export
   ```bash
   npm run build
   npm run export
   ```

2. Deploy the `out` directory to your hosting service (Netlify, Vercel, etc.)

## CI/CD Pipeline

### GitHub Actions Pipeline
1. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Run tests
           run: npm test
           
         - name: Build
           run: npm run build
           
         - name: Deploy to AWS
           uses: aws-actions/configure-aws-credentials@v1
           with:
             aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
             aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
             aws-region: us-east-1
             
         - name: Deploy to ECS
           run: |
             aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPOSITORY
             docker build -t $ECR_REPOSITORY:${{ github.sha }} .
             docker push $ECR_REPOSITORY:${{ github.sha }}
             aws ecs update-service --cluster production --service florida-insurance --force-new-deployment
   ```

### Deployment Strategies
1. **Blue-Green Deployment**:
   - Create two identical environments (Blue and Green)
   - Deploy new version to inactive environment
   - Test thoroughly
   - Switch traffic from active to inactive environment
   
2. **Canary Releases**:
   - Deploy new version to a small subset of servers
   - Route a percentage of traffic to new version
   - Gradually increase traffic as confidence grows
   - Roll back if issues detected

3. **Rolling Updates**:
   - Gradually replace instances of old version with new version
   - Maintain availability during update process
   - Automatically roll back if health checks fail

## Security Configuration

### SSL/TLS Configuration
1. Obtain SSL certificate (AWS Certificate Manager or Let's Encrypt)
2. Configure HTTPS on load balancer or reverse proxy
3. Implement HTTP to HTTPS redirection
4. Set up HSTS headers:
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   ```

### Content Security Policy
Add the following CSP headers to your web server or Next.js configuration:

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' https://trusted-cdn.com; 
  style-src 'self' https://trusted-cdn.com; 
  img-src 'self' data: https://*.amazonaws.com; 
  connect-src 'self' https://api.your-domain.com; 
  frame-ancestors 'none'; 
  form-action 'self';
```

### Additional Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Monitoring & Logging

### Logging Configuration
1. Set up centralized logging with AWS CloudWatch Logs or ELK Stack
2. Configure application to output structured logs in JSON format
3. Include important fields in logs:
   - Request ID
   - User ID (anonymized)
   - API endpoint
   - Response time
   - Error information

### Monitoring Setup
1. Configure AWS CloudWatch metrics or Prometheus for system monitoring
2. Set up dashboards for key metrics:
   - Server CPU and memory usage
   - API response times
   - Error rates
   - Database connection pool usage
   - S3 operations

3. Create alerts for:
   - High error rates (>1%)
   - Slow response times (>500ms)
   - Low disk space (<20%)
   - High CPU usage (>80% for 5 minutes)
   - Database connection issues

### Health Checks
1. Create a `/health` endpoint that checks:
   - Database connectivity
   - S3 connectivity
   - External service availability

2. Configure load balancer to use health check for routing decisions

## Backup & Disaster Recovery

### Database Backup Strategy
1. Enable automated daily backups in RDS
2. Set retention period to 30 days
3. Periodically test backup restoration
4. For critical data, consider cross-region backups

### Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Recovery Steps**:
   - Deploy application infrastructure in secondary region
   - Restore database from latest backup
   - Update DNS records to point to disaster recovery environment
   - Verify application functionality
   - Communicate status to users

### Backup Verification
Schedule monthly backup restoration tests to verify:
- Data integrity
- Restoration process works
- Documentation is accurate
- Recovery time meets objectives

## Scaling Considerations

### Horizontal Scaling
1. Use auto-scaling groups for application servers
2. Configure scaling policies based on:
   - CPU utilization (target 70%)
   - Request count per target
   - Memory utilization

### Database Scaling
1. Start with vertical scaling (increase instance size)
2. For read-heavy workloads, add read replicas
3. Consider sharding for extreme scale requirements
4. Use connection pooling to handle many concurrent connections

### Content Delivery
1. Use CloudFront for global content delivery
2. Configure caching for static assets
3. Implement cache control headers for optimal caching

### Rate Limiting
Implement rate limiting at the API gateway level:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
- Higher limits for specific endpoints as needed

## Post-Deployment

### Verification Checklist
- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Document upload and analysis functions properly
- [ ] API endpoints return expected results
- [ ] Error logging works correctly
- [ ] Monitoring dashboards display data
- [ ] Alerts trigger when thresholds are exceeded
- [ ] SSL certificate is valid
- [ ] Security headers are properly configured

### Performance Testing
Run load tests to ensure the application can handle expected traffic:
- Simulate 1,000 concurrent users
- Test critical user journeys
- Verify response times remain under 500ms
- Identify and address bottlenecks

## Support and Maintenance

### Regular Maintenance Tasks
- Apply security patches monthly
- Review and rotate access credentials quarterly
- Analyze and optimize database performance quarterly
- Review and update monitoring thresholds as needed
- Conduct security assessments semi-annually 