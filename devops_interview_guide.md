# CyberOps SOC Platform: DevOps & Infrastructure End-to-End Guide
## 📘 Comprehensive Study & Interview Preparation Guide

This guide is designed as an offline reference to help you understand, explain, and defend the DevOps and Cloud infrastructure stack implemented for the **CyberOps AIO SOC Platform**. It details the architecture decisions, security hardening, monitoring, disaster recovery, and provides an **Interview Cheat Sheet (Q&A)** to help you succeed in technical discussions.

---

## 🗺️ 1. Architecture Overview & Component Communication

The platform is designed around microservices principles, separating the user interface, backend application logic, database storage, and monitoring stack.

```
       [ Client Browser ]
               │ (HTTPS)
               ▼
   [ Nginx Ingress / Reverse Proxy ]
         /                  \
   (Static Files)       (Proxy /api/*)
       /                      \
      ▼                        ▼
[ React Frontend ]     [ Express Backend ] ──(Scrapes)──► [ Prometheus ]
                               │                                  ▲
                               ▼                                  │ (Queries)
                       [ PostgreSQL DB ]                          │
                               ▲                                  │
                               └─────────(Visualizes)─────── [ Grafana ]
```

### Flow of Data:
1. **User Interaction**: The user accesses the frontend. Static assets (HTML, JS, CSS) are served at high speed by **Nginx** (Port 80).
2. **API Calls**: When the user logs in or queries incidents, requests are sent to `/api/*`. Nginx catches these paths and reverse-proxies them to the Node/Express **Backend API** (Port 3001).
3. **Data Persistence**: The backend communicates with the **PostgreSQL Database** (Port 5432) to persist incident cards, update statuses, or validate analyst credentials.
4. **Metrics Collection**: The backend exposes real-time performance metrics (CPU, memory, request latencies) at `/api/metrics`. **Prometheus** polls this endpoint every 15 seconds.
5. **Dashboarding**: **Grafana** connects to Prometheus as a datasource to visualize system performance.

---

## 📦 2. Containerization & Security Hardening (Docker)

### Design Choices:
- **Multi-Stage Build**: [Dockerfile.frontend](file:///c:/Users/rafii/Downloads/Project/aio-soc-platform/docker/Dockerfile.frontend) uses Node 20 to compile the React code, then copies *only* the compiled static assets (`/dist`) into a raw `nginx:alpine` runner. This keeps the final image footprint under **30MB** and eliminates Node vulnerability exposure.
- **Zero-Trust Security Hardening**:
  - **OS Package Patching**: Running `apk update && apk upgrade --no-cache` on build patches base Alpine Linux vulnerabilities.
  - **Pruning Package Managers**: In [Dockerfile.backend](file:///c:/Users/rafii/Downloads/Project/aio-soc-platform/docker/Dockerfile.backend), we run `npm ci --only=production` to install dependencies and immediately run `rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /opt/yarn*`. By deleting global installers, we eliminate **Trivy CVE warnings** caused by pre-bundled npm scripts.

---

## 🔄 3. CI/CD & Integration Pipeline (GitHub Actions)

The workflow defined in [ci.yml](file:///c:/Users/rafii/Downloads/Project/aio-soc-platform/.github/workflows/ci.yml) follows a strict security and quality gate:

1. **Lint-and-Test Job**: Checks syntax consistency via ESLint and runs Vitest unit tests.
2. **Security-Scan Job**: Uses Trivy to scan the raw filesystem for hardcoded secrets or insecure configuration files.
3. **Docker-Build-and-Scan Job**:
   - Builds frontend and backend Docker images.
   - Runs Trivy container scans on both images, exiting with code `1` if critical or high vulnerabilities are found.
   - **Docker Compose Boot Verification**: Boots the entire stack (`docker compose up -d`), waits 15 seconds, and runs `curl --fail http://localhost/api/health` through the Nginx proxy to verify routing works in the runner environment before tearing down the containers.

---

## ☸️ 4. Local vs. Production Orchestration

| Dimension | Local Dev (Docker Compose) | Production (Kubernetes) |
| :--- | :--- | :--- |
| **Tool** | Docker Compose (`docker-compose.yml`) | Kubernetes Manifests (`/kubernetes`) |
| **Scaling** | Manual port mapping, single-host. | Automatic scaling, Multi-node cluster. |
| **Storage** | Local volume directory mount. | Dynamic Storage Class Claim (PVC). |
| **Availability** | Restarts container on single PC. | Reschedules pods on healthy nodes automatically. |

### Key K8s Resources Explained:
- **Deployments**: Manages replica states. We run 2 replicas of the frontend and backend for high availability and zero-downtime rolling updates.
- **Services**: Stable entrypoints for pods. `ClusterIP` exposes services internally. `NodePort` exposes ports outside the cluster.
- **Ingress**: The cluster's router. It maps incoming host URLs (like `soc-platform.com`) to the correct backend or frontend service.
- **PersistentVolumeClaim (PVC)**: Requests storage space from the cloud provider for PostgreSQL database persistence.

---

## ☁️ 5. AWS Cloud Architecture (Terraform IaC)

Our Terraform configs provision a production-ready AWS landing zone:
- **VPC Networking**: A VPC containing **2 Public Subnets** (hosting the Ingress load balancer and NAT gateway) and **2 Private Subnets** (hosting EKS worker nodes and RDS databases to ensure they are never exposed to the public web).
- **EKS (Elastic Kubernetes Service)**: Standard Kubernetes platform. To keep costs minimal, the node group is configured to use cheap **SPOT instances** of type `t3.small` or `t3.medium`.
- **RDS PostgreSQL**: Configured with a `db.t3.micro` instance (fully covered under **AWS Free Tier**) inside private database subnet groups.
- **Secrets Manager**: Stores database usernames and passwords, bypassing local environment variables to meet compliance requirements.

---

## 📊 6. Monitoring & Alerting Setup

### Prometheus:
- **Pull-Based Metrics**: Prometheus pulls metrics from the backend's `/api/metrics` path.
- **Metric Types**:
  - `http_request_duration_seconds`: Histogram recording path latency.
  - `nodejs_heap_size_used_bytes`: Gauge measuring memory leakage.

### Alertmanager:
- Monitors rules in [alert.rules.yml](file:///c:/Users/rafii/Downloads/Project/aio-soc-platform/monitoring/alert.rules.yml) (e.g. `InstanceDown` if target is offline, `HighRequestLatency` if latency > 1s).
- Routes triggers to a webhook. In [alertmanager.yml](file:///c:/Users/rafii/Downloads/Project/aio-soc-platform/monitoring/alertmanager.yml), this maps to a **Slack Channel** for instant security team notifications.

---

## 💾 7. Disaster Recovery (DR) & Backup Strategy

Our disaster recovery strategy uses shell scripts configured as cron tasks:
- **Backup ([backup.sh](file:///c:/Users/rafii/Downloads/Project/aio-soc-platform/automation/backup.sh))**:
  - Uses `pg_dump` to generate a schema and table data backup.
  - Compresses the backup using `gzip`.
  - Automatically uploads the archive to an **AWS S3 Bucket** if an environment variable `AWS_S3_BUCKET` is present.
- **Restore ([restore.sh](file:///c:/Users/rafii/Downloads/Project/aio-soc-platform/automation/restore.sh))**:
  - Re-downloads the target file from AWS S3 or a local folder.
  - Decompresses, drops existing conflicts, and loads the data using `psql`.

---

## 💬 8. DevOps Interview Cheat Sheet (Q&A)

### Q1: Why did you place Nginx in front of the React frontend?
> **Answer**: Nginx is excellent at serving static files (HTML, CSS, JS) extremely fast with minimal memory footprint. It also acts as our local API gateway/reverse proxy. By routing `/api/*` requests to the Node backend, Nginx eliminates CORS (Cross-Origin Resource Sharing) issues, so the browser interacts with a single unified host endpoint on port 80.

### Q2: How did you handle secrets in Kubernetes and production environments?
> **Answer**: Hardcoding secrets in git is a critical vulnerability. Locally, we use Kubernetes Secrets (`kubernetes/postgres.yaml`) to store the Postgres password, injecting it into backend pods via `valueFrom.secretKeyRef`. In production on AWS, we use **AWS Secrets Manager** to store DB passwords, using AWS IAM Roles for Service Accounts (IRSA) to grant the backend pods secure runtime access to the credentials.

### Q3: How did you fix Trivy vulnerability alerts for node-alpine docker images?
> **Answer**: 
> 1. We run `apk update && apk upgrade --no-cache` inside the container build steps to pull the latest security patches for Alpine OS packages.
> 2. Node base images bundle `npm` and `yarn`, which contain sub-dependencies (like `minimatch`, `glob`, etc.) with reported vulnerabilities. Since we only need these to build the application and not to run it, we added a cleanup step: `rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /opt/yarn*` immediately after `npm ci --only=production`. This successfully resolves the Trivy warnings and reduces image size.

### Q4: How do you verify the Docker Compose configuration works in CI/CD?
> **Answer**: We added a verification step in the GitHub Actions pipeline. After compiling the images, the runner launches `docker compose up -d`, waits 15 seconds for startup handshakes, and issues a health probe: `curl -s --fail http://localhost/api/health`. If this command fails, it outputs container logs and exits with code `1`, preventing buggy configuration merges.

### Q5: How do you keep AWS hosting costs low or completely free?
> **Answer**: For the database, we use a single `db.t3.micro` RDS instance, which is fully covered under the AWS Free Tier. For Kubernetes orchestration, we configure EKS node groups to use **Spot Instances** of type `t3.small` and scale down the replicas to 1 during off-peak hours.
