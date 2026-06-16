

2. MediVault - Local Dispensary Management
Concept: An inventory and ordering system for a local pharmacy or university health center.
Functional Requirements:
Inventory: Admin adds medicines, stock levels, and expiry dates.
Search: Users search by name or symptom.
Cart/Checkout: Users "reserve" medicine for pickup.
Prescription Upload: Mandatory image upload for restricted drugs.


The Twist (Challenge): Interaction Warning System
The database must store "Conflicts" (e.g., Aspirin conflicts with Warfarin).
If a user adds conflicting medications to the cart, or adds a medication that conflicts with one purchased in the last 7 days (history check), the system must trigger a modal warning and prevent checkout.

Before starting specific logic, every project must adhere to these standards:
1. Security & Authentication
Secure Login/Registration: Passwords must be hashed using password_hash.
Role Management: Minimum of two distinct roles (e.g., User vs. Admin).
SQL Injection Prevention: Use Prepared Statements for all database queries.
XSS Prevention: Sanitize all user inputs to prevent Cross-Site Scripting.
2. UI/UX & Design
Responsive Design: UI must work seamlessly on Mobile and Desktop (use CSS Flexbox/Grid).
Feedback: Informative error messages and success notifications.
Performance: Pages should load under 2 seconds; images must not be broken.
3. Code & Database Quality
Validation: Implement both Client-side (JS) and Server-side (PHP) validation.
Structure: No spaghetti code. Use include/require for Headers, Footers, and DB Connections.
Database Design: Minimum 3rd Normal Form (3NF) with correct Foreign Keys.
