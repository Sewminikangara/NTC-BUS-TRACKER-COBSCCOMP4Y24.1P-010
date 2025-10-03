# NTC Bus Tracker - System Architecture

**Student ID:** COBSCCOMP24.1P-010

## 1. System Overview

The NTC Bus Tracker is a RESTful API system designed to provide real-time tracking of inter-provincial buses across Sri Lanka. The system follows a three-tier architecture pattern with clear separation of concerns.

## 2. Architecture Layers

### 2.1 Presentation Layer (API Layer)
- **Express.js** routes handling HTTP requests
- RESTful endpoints following REST principles
- Request validation using Joi schemas
- Response formatting with consistent JSON structure
- CORS enabled for cross-origin access

### 2.2 Business Logic Layer
- Controllers handling business logic
- Middleware for authentication, authorization, and validation
- Custom error handling with appropriate HTTP status codes
- Logging system using Winston

### 2.3 Data Access Layer
- Mongoose ODM for MongoDB interaction
- Database models with validation and relationships
- Indexes for query optimization
- Data sanitization against NoSQL injection

## 3. Technology Stack

### 3.1 Core Technologies
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.x
- **Database:** MongoDB with Mongoose ODM
- **Language:** JavaScript (ES6+)

### 3.2 Security
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** bcryptjs
- **Security Headers:** Helmet.js
- **Rate Limiting:** express-rate-limit
- **Data Sanitization:** express-mongo-sanitize
- **CORS:** cors middleware

### 3.3 Code Quality
- **Linting:** ESLint with Airbnb base config
- **Validation:** Joi
- **Testing:** Jest
- **Logging:** Winston

## 4. Database Design

### 4.1 Collections

#### Users Collection
- Stores system users (admin, operators, commuters)
- Fields: name, email, password (hashed), role, status
- Indexes: email (unique), role, status
- Relationships: operatorId references Operators

#### Routes Collection
- Stores inter-provincial bus routes
- Fields: routeNumber, name, origin, destination, stops, distance, fare
- Indexes: routeNumber (unique), origin-destination composite
- Nested: stops array with coordinates

#### Buses Collection
- Stores bus information
- Fields: registrationNumber, make, model, capacity, features
- Relationships: routeId, operatorId
- Indexes: registrationNumber (unique), routeId-status composite

#### Trips Collection
- Stores scheduled and active trips
- Fields: tripNumber, scheduledTimes, actualTimes, status, driver
- Relationships: busId, routeId
- Indexes: busId-departureTime, routeId-departureTime, status

#### LocationUpdates Collection
- Stores real-time GPS locations
- Fields: coordinates (lat/lng), speed, heading, timestamp
- Relationships: busId, tripId
- Indexes: busId-timestamp, tripId-timestamp
- TTL Index: Auto-delete after 30 days

#### Operators Collection
- Stores bus operator/company information
- Fields: name, registrationNumber, contactPerson, license
- Indexes: registrationNumber (unique), licenseNumber (unique)

### 4.2 Relationships
- One-to-Many: Route → Buses
- One-to-Many: Route → Trips
- One-to-Many: Operator → Buses
- One-to-Many: Bus → Trips
- One-to-Many: Bus → LocationUpdates
- One-to-Many: Trip → LocationUpdates

## 5. API Design Principles

### 5.1 RESTful Conventions
- Resource-based URLs (/api/buses, /api/routes)
- HTTP methods: GET, POST, PUT, PATCH, DELETE
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- JSON request/response format

### 5.2 Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC)
  - Admin: Full access to all resources
  - Operator: Update bus locations, view assigned buses
  - Commuter: Read-only access to public data

### 5.3 Advanced Features
- Filtering: Query parameters (?status=active)
- Sorting: Multiple fields (?sort=price,-rating)
- Pagination: Page-based (?page=2&limit=10)
- Field Selection: Limit response fields (?fields=name,email)
- Conditional GET: ETag support (planned)

## 6. Security Measures

### 6.1 Authentication Security
- Passwords hashed using bcrypt (salt rounds: 10)
- JWT tokens with expiration (7 days)
- Token verification on protected routes
- User status validation (active/inactive/suspended)

### 6.2 API Security
- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- MongoDB injection prevention
- Input validation and sanitization
- Error message sanitization in production

### 6.3 Data Security
- Environment variables for sensitive data
- Password field excluded from queries by default
- User role-based data access
- Request body size limits (10MB)

## 7. Scalability Considerations

### 7.1 Database Scalability
- Indexed fields for fast queries
- TTL indexes for automatic data cleanup
- Connection pooling
- Query optimization with lean() and select()

### 7.2 Application Scalability
- Stateless API design (JWT in headers)
- Horizontal scaling capability
- Compression middleware
- Efficient error handling
- Background job support (planned)

### 7.3 Performance Optimization
- Database query optimization with indexes
- Response compression
- Pagination to limit data transfer
- Field selection to reduce payload size
- Caching headers (planned)

## 8. Error Handling Strategy

### 8.1 Error Types
- Operational Errors: Expected errors (validation, 404)
- Programming Errors: Unexpected errors (bugs)

### 8.2 Error Response Format
```json
{
  "status": "error",
  "message": "Human-readable error message"
}
```

### 8.3 Error Logging
- Winston logger with multiple transports
- Console output in development
- File logging (error.log, combined.log)
- Timestamp and log level included

## 9. Monitoring & Logging

### 9.1 Application Logs
- Request logging with Morgan
- Application logs with Winston
- Different log levels: error, warn, info, debug
- Log rotation (planned)

### 9.2 Health Monitoring
- Health check endpoint (/health)
- Database connection monitoring
- Uptime tracking
- Error rate monitoring (planned)

## 10. Deployment Architecture

### 10.1 Development Environment
- Local MongoDB instance
- Node.js development server
- Environment-specific configuration (.env)

### 10.2 Production Environment (Planned)
- Cloud hosting (Railway/Render/Heroku)
- MongoDB Atlas (cloud database)
- HTTPS encryption
- Environment variable management
- Continuous deployment from GitHub

## 11. API Versioning Strategy

- Current: v1
- URL-based versioning: /api/v1/
- Backward compatibility maintained
- Deprecation notices for old versions

## 12. Future Enhancements

### 12.1 Technical Improvements
- WebSocket support for real-time updates
- Redis caching layer
- GraphQL API alternative
- Microservices architecture
- Container deployment (Docker)

### 12.2 Feature Additions
- Push notifications for bus arrivals
- Route optimization algorithms
- Predictive delay alerts
- Historical data analytics
- Admin dashboard

## 13. Testing Strategy

### 13.1 Unit Testing
- Model validation tests
- Utility function tests
- Middleware tests

### 13.2 Integration Testing
- API endpoint tests
- Authentication flow tests
- Database operation tests

### 13.3 Test Coverage
- Target: 70% code coverage
- Jest test framework
- Supertest for HTTP testing

## 14. Documentation Standards

### 14.1 Code Documentation
- JSDoc comments for all functions
- Inline comments for complex logic
- README for project overview
- API documentation (OpenAPI 3.0)

### 14.2 API Documentation
- OpenAPI/Swagger specification
- Request/response examples
- Error response documentation
- Authentication requirements

## 15. Compliance & Standards

### 15.1 REST Compliance
- Resource-based URLs
- HTTP method semantics
- Status code appropriateness
- HATEOAS principles (partial)

### 15.2 Code Standards
- ESLint with Airbnb style guide
- Consistent naming conventions
- Modular architecture
- DRY principle

## 16. Risk Mitigation

### 16.1 Technical Risks
- Database connection failures → Retry logic
- High traffic → Rate limiting
- Security vulnerabilities → Regular updates
- Data loss → Backup strategy (planned)

### 16.2 Operational Risks
- Server downtime → Health monitoring
- Invalid data → Input validation
- Unauthorized access → Authentication & authorization
- API abuse → Rate limiting & monitoring

**Last Updated:** October 3, 2025  