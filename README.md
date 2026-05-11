# Kramanik — Coaching Institute Management SaaS

A full-stack, multi-tenant SaaS platform built to digitize operations for small coaching institutes across India.

## Features

- **Student Management** — Add, edit, search students with parent contact details
- **Batch Management** — Create batches with schedules, timings, and monthly fees
- **Student Enrollment** — Enroll students into specific batches
- **Fee Tracking** — Create fee records, record payments (Cash/UPI/Bank), track outstanding dues
- **Attendance** — Mark daily attendance (Present/Absent/Late) per batch, monthly summary reports
- **WhatsApp Notifications** — Send fee reminders and attendance alerts to parents via WhatsApp Business API
- **Multi-tenant Auth** — JWT-based authentication, each institute sees only its own data
- **Subscription Plans** — FREE / BASIC / PRO tiers with hard plan limit enforcement
- **Razorpay Integration** — Automated payment and plan activation
- **Deployment Ready** — Docker, Railway (backend), Netlify (frontend)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA |
| Database | MySQL 8 |
| Authentication | JWT (jjwt) |
| Frontend | Vanilla JS, HTML5, CSS3 (multi-page, modular) |
| Payments | Razorpay |
| WhatsApp | WATI (WhatsApp Business API) |
| DevOps | Docker, Docker Compose, Nginx |
| Deployment | Railway (backend), Netlify (frontend) |

## Project Structure

```
kramanik/
├── sql/
│   └── schema.sql                  # Database schema + seed data
├── backend/                        # Spring Boot application
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/in/kramanik/
│       ├── model/                  # JPA entities
│       ├── repository/             # Spring Data repositories
│       ├── service/                # Business logic
│       ├── controller/             # REST API endpoints
│       ├── security/               # JWT filter + config
│       ├── config/                 # Plan limits config
│       └── exception/              # Global error handling
├── frontend/                       # Static HTML/CSS/JS
│   ├── index.html                  # Login
│   ├── dashboard.html
│   ├── students.html
│   ├── batches.html
│   ├── fees.html
│   ├── attendance.html
│   ├── notifications.html
│   ├── settings.html
│   ├── register.html
│   ├── css/main.css                # Shared styles
│   └── js/
│       ├── config.js               # API base URL (local vs prod)
│       ├── api.js                  # All API calls
│       ├── utils.js                # Shared utilities
│       ├── nav.js                  # Sidebar renderer
│       └── pages/                  # One JS file per page
├── docker-compose.yml              # Full local stack
├── nginx.conf                      # Frontend server + API proxy
├── railway.json                    # Railway deployment config
├── netlify.toml                    # Netlify deployment config
├── .env.example                    # Environment variable template
└── DEPLOY.md                       # Full deployment guide
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/public/register` | Register new institute |
| GET | `/api/students` | List active students |
| POST | `/api/students` | Add student |
| GET | `/api/batches` | List active batches |
| POST | `/api/enrollments` | Enroll student in batch |
| POST | `/api/fees` | Create fee record |
| POST | `/api/fees/{id}/pay` | Record payment |
| GET | `/api/fees/summary` | Monthly collection + outstanding |
| POST | `/api/attendance` | Bulk mark attendance |
| GET | `/api/attendance/summary` | Monthly attendance report |
| POST | `/api/notifications/send` | Send WhatsApp notifications |
| GET | `/api/institute/me` | Institute profile + plan usage |
| PUT | `/api/institute/upgrade` | Upgrade subscription plan |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment + activate plan |
| POST | `/api/payments/webhook` | Razorpay webhook handler |

## Subscription Plans

| Feature | FREE | BASIC | PRO |
|---------|------|-------|-----|
| Students | 30 | 100 | Unlimited |
| Batches | 2 | 10 | Unlimited |
| WhatsApp Notifications | ❌ | ✅ | ✅ |
| Monthly Reports | ❌ | ❌ | ✅ |
| Price | ₹0 | ₹499/mo | ₹999/mo |

## Local Setup

### Prerequisites
- Java 17+
- Maven 3.9+
- MySQL 8+

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/kramanik.git
cd kramanik
```

**2. Create the database**
```bash
mysql -u root -p -e "CREATE DATABASE kramanik_db;"
mysql -u root -p kramanik_db < sql/schema.sql
```

**3. Set environment variables**

Create a `.env` file or set these in your IDE run configuration:
```
SPRING_DATASOURCE_PASSWORD=your_mysql_password
KRAMANIK_JWT_SECRET=any_long_random_string_64_chars_minimum
```

**4. Run the backend**
```bash
cd backend
mvn spring-boot:run
```
Backend runs at `http://localhost:8080`

**5. Run the frontend**
```bash
cd frontend
python -m http.server 5500
```
Open `http://localhost:5500`

**6. Login**
```
Email:    admin@kramanik.in
Password: Admin@123
```

### Docker (alternative — runs everything in one command)
```bash
cp .env.example .env
# edit .env with your passwords
docker compose up --build
# open http://localhost
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for full Railway + Netlify deployment instructions.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPRING_DATASOURCE_PASSWORD` | ✅ | MySQL password |
| `KRAMANIK_JWT_SECRET` | ✅ | JWT signing key (min 64 chars) |
| `SPRING_DATASOURCE_URL` | Optional | Full JDBC URL (defaults to localhost) |
| `SPRING_DATASOURCE_USERNAME` | Optional | MySQL username (defaults to root) |
| `KRAMANIK_CORS_ALLOWED_ORIGINS` | Optional | Frontend URL for CORS |
| `RAZORPAY_KEY_ID` | Optional | Razorpay key (for payments) |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay secret |
| `WATI_API_TOKEN` | Optional | WhatsApp Business API token |
| `WATI_ENABLED` | Optional | Set `true` to enable WhatsApp (default: false) |

## Author

**Utkarsh Kumar**
[LinkedIn](https://linkedin.com/in/YOUR_PROFILE) · [GitHub](https://github.com/YOUR_USERNAME)
