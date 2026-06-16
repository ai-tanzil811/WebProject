# 🏥 MediVault: Local Dispensary Management System

## 🚀 Project Overview
**MediVault** is a sophisticated inventory and ordering system tailored for local pharmacies or university health centers. It transitions from a standard e-commerce platform into a clinical safety tool through its advanced interaction logic.

### 🌟 The Core Innovation: "The Twist"
Unlike standard pharmacy apps, MediVault implements a **Drug Interaction Warning System**.
* **Real-time Cart Validation:** Checks if medicines added to the current cart conflict with each other.
* **Historical Check:** Cross-references the current cart against the user's **last 7 days of purchase history**.
* **Safety Protocol:** Triggers a modal warning and blocks the checkout process if a "Severe" conflict is detected.

---

## 🛠 Tech Stack & Security
* **Frontend:** HTML5, CSS3 (Flexbox/Grid), JavaScript (Vanilla).
* **Backend:** Node.js & Express.js.
* **Database:** MySQL (3rd Normal Form compliant).
* **Security:** Bcryptjs hashing, Prepared Statements, and Session-based Auth.

---

## 📂 Project Structure & Navigation

### 🗺️ Frontend Map
| Page | Purpose |
| :--- | :--- |
| LandingPage.html | Entry point for all users. |
| User_login.html | Access for patients/customers. |
| Admin_login.html | Access for pharmacists/staff. |
| Shopping.html | Medicine catalog with search and filters. |
| Checkout.html | Order confirmation and conflict summary. |
| Admin_dashboard.html | Overview of system stats and pending orders. |

---

## 🧠 Deep Technical Details

### 🧬 Database Schema (3NF)
* **Medicines:** Core drug info (Generic name, Brand, Strength, Price).
* **Inventory:** Tracks physical stock using Batch Numbers and Expiry Dates.
* **DrugConflicts:** Mapping table for interactions with severity levels.
* **Orders:** Maintains a record for the 7-day history lookup.

### 🔍 Interaction Logic Flow
1. **Identify** all medicine IDs in the current cart.
2. **Check** self-conflicts within the cart.
3. **Query** orders from the last 7 days for that user.
4. **Cross-reference** past items with new items.
5. **Return** JSON conflict data to trigger the UI warning modal.

---

## 👤 Developer Information
* **Lead Developer:** Ashraful Islam Tanzil
* **Institution:** United International University (UIU)
* **Department:** Computer Science and Engineering (CSE)
* **Student ID:** 0112230028
* **Expertise:** Full-Stack Web Development (Node.js, Laravel, React), Machine Learning, and IoT.