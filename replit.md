# Overview

This is an e-commerce marketplace platform called "ecowsco-market" that enables vendors to create their own online stores and manage products. The application provides vendor registration, authentication, product management (add, edit, delete), shopping cart functionality with WhatsApp checkout, and password recovery. Each vendor gets a unique store name that serves as their storefront identifier.

## Recent Updates (October 2025)
- **Currency**: Changed from USD ($) to Ghana Cedis (₵) across all pages
- **Product Management**: Added edit and delete functionality for vendors
- **Registration Flow**: Shows store link immediately after successful registration
- **Shopping Cart**: Full cart implementation with localStorage persistence
- **WhatsApp Checkout**: Customers can checkout via WhatsApp with auto-filled order details
- **UI Upgrade**: Modern gradient-based design system across all pages

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Application Framework
- **Node.js with Express.js**: The application uses Express as the web framework running on Node.js with CommonJS module system (require/module.exports)
- **Template Engine**: EJS (Embedded JavaScript) for server-side rendering of HTML views
- **Session Management**: express-session middleware for handling user authentication state with session-based authentication

## Database Architecture
- **PostgreSQL Database**: Uses Neon PostgreSQL as the primary database (hosted cloud Postgres service)
- **Connection Pooling**: pg library with connection pooling for efficient database connections
- **SSL Configuration**: Database connections require SSL with `rejectUnauthorized: false` for Neon compatibility

### Data Schema Design
The system uses three main tables:

1. **Vendors Table**: Stores vendor account information
   - Unique identifiers: email and store_name (both enforced at database level)
   - Password storage: bcrypt hashed passwords
   - Store metadata: name, WhatsApp contact, description

2. **Products Table**: Stores product listings
   - Foreign key relationship to vendors (CASCADE delete for data integrity)
   - Product details: name, price (NUMERIC for precision), image URL, description

3. **Password Resets Table**: Temporary storage for password reset tokens
   - Time-based expiration mechanism
   - Token-based recovery flow

## Authentication & Security
- **Password Hashing**: bcrypt library for secure password storage (one-way hashing)
- **Session Security**: Secret-based session management with environment variable configuration
- **Password Recovery**: Token-based password reset system with expiration timestamps

## Email Integration
- **EmailJS Service**: Third-party email service for transactional emails (password resets, notifications)
- **Configuration**: Uses service ID, template ID, and public/private key pairs for authentication
- **Error Handling**: Silent failure with console logging to prevent blocking user flows

## Frontend Architecture
- **Static Assets**: Public folder serves static files (CSS, JavaScript, images)
- **Client-Side Validation**: AJAX-based store name availability checking with debounce pattern (300ms delay)
- **Real-time Feedback**: Visual indicators for form validation (✅/❌ for availability status)
- **Shopping Cart**: Client-side cart management using localStorage with per-store isolation
- **WhatsApp Integration**: Direct checkout to vendor's WhatsApp with formatted order message
- **Modern UI**: Gradient-based design system with Tailwind CSS

## Key Design Patterns
1. **Store Name Sanitization**: Custom helper function to ensure consistent store name formatting (prevents duplicates with different casing/spacing)
2. **Debounced API Calls**: Client-side debouncing reduces unnecessary database queries during user input
3. **Cascade Deletion**: Products automatically deleted when vendor account is removed (database-level integrity)
4. **Environment-Based Configuration**: All sensitive credentials and configuration stored in environment variables
5. **Vendor Isolation**: Edit/delete operations enforce vendor_id checks to prevent cross-vendor access
6. **Cart Persistence**: Per-vendor cart storage in localStorage allows customers to shop across multiple stores
7. **WhatsApp Protocol**: Direct wa.me links with pre-filled messages for seamless order placement

# External Dependencies

## Third-Party Services
- **Neon Database**: Cloud-hosted PostgreSQL database service
  - Requires SSL connection
  - Connection via DATABASE_URL environment variable

- **EmailJS**: Email delivery service for transactional emails
  - Requires: EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID
  - Authentication: EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY

## NPM Packages
- **@emailjs/nodejs** (^5.0.2): Email sending functionality
- **bcrypt** (^6.0.0): Password hashing and comparison
- **body-parser** (^2.2.0): Request body parsing middleware
- **dotenv** (^17.2.3): Environment variable management
- **ejs** (^3.1.10): Template rendering engine
- **express** (^4.19.2): Web application framework
- **express-session** (^1.18.2): Session management middleware
- **pg** (^8.16.3): PostgreSQL client for Node.js
- **node-fetch** (^3.3.2): HTTP client (likely for API calls)
- **nodemailer** (^7.0.9): Alternative email library (appears unused in current code)

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `SESSION_SECRET`: Secret key for session encryption
- `EMAILJS_SERVICE_ID`: EmailJS service identifier
- `EMAILJS_TEMPLATE_ID`: EmailJS email template identifier
- `EMAILJS_PUBLIC_KEY`: EmailJS public API key
- `EMAILJS_PRIVATE_KEY`: EmailJS private API key

## Database Initialization
- **initTables.js**: Standalone script to create database schema
- Run separately to initialize tables before application start
- Creates tables with appropriate constraints and relationships