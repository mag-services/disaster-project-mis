# Email (Short Version): Request for NDMO Server Access

**To:** Fidel  
**Subject:** Request for NDMO Server Access – MIS Deployment

---

Dear Fidel,

I am writing to request access to the NDMO server to prepare for hosting the Disaster Risk Management Information System (MIS). We would like to deploy the MIS with a proper domain name (e.g. `mis.ndmo.gov.vu`) and HTTPS so that MoCCA and stakeholders can access it securely for user acceptance testing.

**Request Summary**
- SSH and/or administrative access to the NDMO server
- Purpose: Prepare environment for MIS deployment (Docker, domain, SSL)
- Timeline: To start as soon as access is granted

**Why HTTPS and a domain are required**
Several MIS features only work over HTTPS: geolocation, screen capture, PWA/offline support, and secure sessions. Without a domain and SSL, these cannot be tested properly.

**Features to test on the server (once deployed)**
- Interactive map with Disaster and Climate modes
- Tabular, vector, raster, and PMTiles layers
- Area Administrator data entry (with offline saving)
- Field check records for damage verification
- Feedback form with screen capture
- PWA and mobile-responsive layout
- 2FA, admin, and export (PDF, XLSX)

**Next steps**
1. Grant access to the NDMO server
2. Confirm domain and DNS
3. Ensure ports 80 and 443 are open
4. Deploy and test with MoCCA and stakeholders

I can share the deployment documentation if needed. Please let me know when access can be granted.

Thank you for your support.

Best regards,  
[Your name]
