# Email: Request for NDMO Server Access to Host MIS

**To:** Fidel  
**Subject:** Request for NDMO Server Access – Disaster Project MIS Deployment and Testing

---

Dear Fidel,

I am writing to request access to the NDMO server to prepare for hosting the Disaster Risk Management Information System (MIS). We would like to deploy the MIS with a proper domain name (e.g. `drmis.ndmo.gov.vu` or `drmis.gov.vu`) and HTTPS so that MoCCA (Ministry of Climate Change and Adaptation) and stakeholders can access it, test it, and submit feedback for improvement or changes.

We particularly want MoCCA staff to test and provide feedback, as they are the experts and have the domain knowledge on what features a disaster/climate dashboard should include and how processes should work. Their input will be essential to ensure the MIS meets real-world needs.

**I am requesting two things:**

1. **Access to the NDMO server** – SSH access is the preferred way to deploy and manage the MIS (Docker, SSL, etc.). Please grant SSH and/or administrative access so we can prepare the environment for deployment.

2. **Approval to work with DCDT** – Approval to liaise with DCDT to create the MIS subdomains. Our recommended architecture (per developer guidance) runs each service on its own subdomain for easier maintenance and independent updates:
   - `drmis.ndmo.gov.vu` – frontend (web app)
   - `api.drmis.ndmo.gov.vu` – backend (Django API)
   - `titiler.drmis.ndmo.gov.vu` – map tiles service
   A simple email reply or written approval is sufficient. I will then liaise with DCDT and forward your approval as supporting documentation when requesting these subdomains.

Timeline: To start as soon as access and approval are granted.

Why HTTPS and a domain are required
Several MIS features only work over HTTPS: geolocation, screen capture, PWA/offline support (offline support is very crucial, for example for field checks), and secure sessions. Without a domain and SSL, these cannot be tested properly.

Features to test on the server (once deployed)
- Interactive map with Disaster and Climate modes
- Tabular, vector, raster, and PMTiles layers
- Area Administrator data entry (with offline saving)
- Field check records for damage verification
- Feedback form with screen capture
- PWA and mobile-responsive layout
- 2FA, admin, and export (PDF, XLSX)
- Etc.

I will of course document the server deployment for the NDMO server administrator.

**Next step: Training readiness**

Once we are satisfied with all the testing and the MIS is running accordingly, Shefa training (VBoS training of MoCCA staff) can begin. Feedback for changes or new features will be continuous, but we are at a point where we can begin training of NDMO/MoCCA staff.

Thank you for your support.

Best regards,  
[Your name]
