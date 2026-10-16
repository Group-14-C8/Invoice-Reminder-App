# Invoice & Payment-Reminder App

A web app for freelancers and small businesses to create invoices, track paid/unpaid
status, and send automatic payment reminders. Includes an admin dashboard showing
overdue totals.

## Overview

Invoice Reminder App is a full-stack web application that helps freelancers and small businesses create invoices, track payments, and automatically remind clients when payment is due or overdue.

### The Problem

Freelancers and SMEs often send invoices by email, WhatsApp, or PDF, then lose track of who has paid. Chasing late payers is awkward and easy to forget, and the cashflow picture ends up in someone's head or a messy spreadsheet.

### What It Does

- Creates invoices quickly with line items and client details

- ***Tracks status*** — Draft, Sent, Paid, or Overdue

- Reminds clients automatically via email when payment is due or late

- ***Shows dashboards*** — users see their unpaid/paid totals and overdue invoices; admins see system-wide activity

### Who Uses It

**User (freelancer/SME owner)***: 	Registers, adds clients, creates invoices, marks them paid, tracks what they're owed
***Admin (platform owner)***: Views system-wide totals, overdue amounts, and activity across all users

### Core Features

- JWT authentication (register, login, logout)

- Client and invoice CRUD with line items

- Status tracking: Draft, Sent, Paid, Overdue

- Mark-as-paid action that stops reminders

- User dashboard (unpaid, paid, overdue)

- Admin dashboard (system-wide totals)

- Automatic email reminders with deduplication via ReminderLog

- /health endpoint for monitoring

- Automatic deployment via GitHub Actions on every push

## Architecture

It is a containerized full-stack web application built with ASP.NET Core 8, Entity Framework Core, React, and SQLite. It is packaged as a single Docker image containing both the API and the frontend, served together on port 8080.

GitHub Actions handles the CI/CD pipeline. On every push, it builds the image, pushes it to Docker Hub with two tags (:latest and the commit SHA), then deploys based on the branch. Pushes to deployment-branch deploy to a self-managed Ubuntu server on AWS EC2, which serves as the staging environment — access is restricted to developer IPs via the Security Group. Pushes to main deploy to Azure App Service, the production environment, where users access the app over auto-provisioned HTTPS.

Both targets run the same image but maintain independent SQLite databases, keeping staging and production isolated while demonstrating the portability of containerization across cloud providers.

![Architecture Diagram](./full_archi.png)

## Tech stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | ASP.NET Core 8 | REST API, authentication, background worker |
| **ORM** | Entity Framework Core | Database access and schema management |
| **Database** | SQLite | Embedded, file-based relational database |
| **Frontend** | React + Vite | Single-page application with fast dev builds |
| **Testing** | xUnit | Unit and integration tests for the API |
| **CI/CD** | GitHub Actions | Automated build, test, and deployment pipeline |
| **Hosting** | Azure App Service + AWS EC2 | Two independent deployment targets |

## Run locally

The application can be run locally using Docker to match the production environment, or using the .NET SDK and Node.js for faster development iteration.

### With Docker

```
docker build -t invoice-reminder-app .
docker run -d --name invoice-reminder -p 8080:8080 -v invoice-data:/app/data invoice-reminder-app
```

The -v invoice-data:/app/data volume persists the SQLite database across container restarts.

### Without Docker

Run the API and frontend separately:

```
dotnet run --project src/InvoiceApp.Api
npm install && npm run dev
```

### Verification

The following were confirmed during local testing: the React frontend loads correctly, Swagger documents all endpoints, user registration and login work end-to-end with JWT issuance, the SQLite database is auto-created on first run via EnsureCreated(), and the background ReminderWorker starts without errors. Container logs show a clean startup with no connection or authentication failures.

## Environment variables

Environment variables are runtime configuration values injected into the container by the operating system, used instead of hardcoding secrets or environment-specific settings. In .NET, they override values in appsettings.json using a double-underscore convention (Jwt__Key maps to Jwt:Key). In this project, Azure App Service uses the WEBSITES_PORT=8080 variable to route traffic to the correct container port. This approach keeps sensitive values (JWT keys, database credentials) out of source control and allows the same Docker image to run in different environments without modification.

## CI/CD workflow

The CI/CD pipeline is implemented with GitHub Actions in .github/workflows/CICD.yaml. It triggers automatically on every push to main and deployment-branch, but routes each branch to a different deployment target. The workflow runs on a fresh Ubuntu runner and shares the same build step for both branches, then uses branch-specific conditions to decide which deploy step executes.

### Shared steps (both branches)

1. ***Checkout*** — pulls the repository onto the runner

2. ***Docker Hub login*** — authenticates using GitHub Secrets (DOCKER_USERNAME, DOCKERHUB_TOKEN)

3. ***Build and push*** — builds the multi-stage Docker image and pushes it to Docker Hub with two tags: :latest and :<commit-sha>

### Branch-specific deploy steps

4. **SSH deploy** — runs only on deployment-branch (if: github.ref == 'refs/heads/deployment-branch'). Logs into the Ubuntu server on AWS EC2 using an SSH key and pulls the latest image. The EC2 instance acts as a staging environment — access to port 8080 is restricted at the Security Group level to the developers' public IPs only, so it is not reachable by end users.

5. **Azure deploy** — runs only on main (if: github.ref == 'refs/heads/main'). Instructs Azure App Service to pull the image tagged with the commit SHA and restart. Azure is the production environment — it is the only URL that end users access, served over auto-provisioned HTTPS.

### Branch-to-target mapping

| Branch | Build & push | SSH deploy (EC2) | Azure deploy |
|--------|:------------:|:----------------:|:------------:|
| `deployment-branch` | ✅ | ✅ (staging) | ⏭ skipped |
| `main` | ✅ | ⏭ skipped | ✅ (production) |


### Why this design?

- ***deployment-branch*** acts as the staging channel — every push validates the build and ships it to the EC2 instance for smoke testing, without exposing anything to real users.

- ***main*** is the protected production channel — changes reach it only through pull requests, and each merge deploys straight to Azure.

- One image, two environments — the exact same container is deployed to both targets, ensuring that what passes staging is what ships to production.


The SHA tag is used for the Azure deployment to force Azure to pull a fresh image on every run, avoiding stale-cache issues with the latest tag. This setup achieves full automation: a single git push builds, ships, and deploys the application with no manual steps.

![CICD Diagram](./cicd.png)

Both environments are provisioned from the same Docker image via the same GitHub Actions workflow, but they are triggered by different branches: deployment-branch deploys to the EC2 staging server for validation, while main deploys to Azure for production. This gives the team a safe place to test changes before they reach real users, while also demonstrating that the containerized application is portable and not tied to any single cloud provider.


## Deployment (Azure App Service + Ubuntu Server on AWS EC2)

The application is deployed to two independent targets, both pulling the same Docker image from Docker Hub. This demonstrates the portability of the containerized application across a managed PaaS environment and a self-managed cloud VM.

### Azure App Service

The application is deployed to Azure App Service using the Docker Container publish method. Azure pulls the image from Docker Hub and runs it on a managed Linux host, exposing it via https://invoice-reminder-akbnezbxdvh4axg6.australiaeast-01.azurewebsites.net with automatically provisioned HTTPS. Deployment is authenticated via a Publish Profile (XML credentials) stored as a GitHub Secret. The WEBSITES_PORT=8080 application setting is configured in Azure to match the container's listening port.

**Regarding staging slots**: Azure App Service supports deployment slots for zero-downtime (blue-green) deployments — new versions can be deployed to a staging slot, tested, and then swapped into production instantly. However, slots require a Standard S1 or higher App Service Plan. This project uses the Free F1 tier for cost reasons, which does not support slots. As a result, deployments currently target the production slot directly, causing a brief restart during each release. For a production-grade setup, upgrading the tier and adding a slot-name: staging parameter to the webapps-deploy step would enable safe, zero-downtime releases.

### Ubuntu Server on AWS EC2 (Staging)

The same Docker image is also deployed to a self-managed Ubuntu server running on an AWS EC2 instance, which serves as the staging and testing environment. Deployment is handled by the same GitHub Actions workflow using appleboy/ssh-action, triggered only on pushes to deployment-branch. The workflow authenticates to the EC2 instance using an SSH key pair stored as a GitHub Secret. Once connected, it pulls the latest image from Docker Hub, stops and removes any previous container, starts a fresh one bound to port 8080 with --restart always, and prunes unused images.

***Access is restricted to developers only***. The EC2 Security Group allows inbound traffic on port 8080 (http://54.167.46.5:8080/) exclusively from the developers' public IPs, so the staging environment is not reachable by end users. This provides a real, containerized environment for testing new builds before they are promoted to production.

***Key characteristics***: Docker must be installed on the instance and the SSH user must be a member of the docker group; HTTPS is not provisioned automatically and is not required since access is IP-restricted; the --restart always flag ensures the container restarts automatically on crash or EC2 reboot; and each environment maintains its own SQLite database — data is not shared between EC2 and Azure.

### Summary

| Aspect | Azure App Service | Ubuntu Server (AWS EC2) |
|--------|-------------------|--------------------------|
| **Role** | Production | Staging / testing |
| **Host type** | Managed PaaS | Self-managed VM (IaaS) |
| **Deploy trigger** | Push to `main` | Push to `deployment-branch` |
| **Deploy method** | `azure/webapps-deploy` | `appleboy/ssh-action` |
| **Auth** | Publish Profile (XML) | SSH key (`key.pem`) |
| **Image tag pulled** | `:<commit-sha>` | `:latest` |
| **Access** | Public — any user | Restricted — developer IPs only |
| **HTTPS** | Auto-provisioned | Not configured (not needed) |
| **Database** | SQLite (per instance) | SQLite (per instance) |



## Health check and monitoring

The following mechanisms are used to monitor the application across its two deployment targets:

- **`/health` endpoint** — ASP.NET Core's built-in health check, registered via `AddHealthChecks().AddDbContextCheck<AppDbContext>()`. It verifies the API is running and that the database is reachable. Available at `/health` on both Azure and the EC2 instance.
- **Application logs** — captured via the standard ASP.NET Core logging pipeline. Locally, logs stream to the terminal with `docker logs -f invoice-reminder`. On Azure, they are viewable in **Log Stream** under the Web App's Monitoring section. On EC2, they are accessed via `docker logs invoice-reminder` over SSH.
- **Server and container health monitoring** — the container runs with `--restart always`, ensuring automatic recovery from crashes or host reboots. Azure App Service provides built-in health monitoring, automatic restarts, and metrics for CPU, memory, and request counts via the Azure Portal.

## Troubleshooting


| Problem | Cause | Fix |
|---------|-------|-----|
| `no such table: Invoices` | Schema not created on startup | Add `db.Database.EnsureCreated();` in `Program.cs`, delete old volume with `docker volume rm invoice-data` |
| `IDX10703: key length is zero` | Empty `Jwt:Key` in `appsettings.json` | Set a 32+ character key, or pass `Jwt__Key` as an environment variable |
| `SqlException: server was not found` | Connection string points to Windows SQL Server | Switch to SQLite: `Data Source=/app/data/invoiceapp.db` and use `UseSqlite` |
| Frontend 404 at `/` | Static files not served | Add `app.UseDefaultFiles(); app.UseStaticFiles(); app.MapFallbackToFile("index.html");` |
| Docker build: `csproj not found` | Wrong path in Dockerfile | Verify paths with `find . -name "*.csproj"` and fix `COPY` lines |
| `Publish profile is invalid` | `app-name` mismatch or stale secret | Match `app-name` to Azure Web App name, re-download publish profile |
| Azure returns 502/503 | Wrong port | Set `WEBSITES_PORT=8080` in App Settings |
| `git push` to main rejected | Branch protection | Open a PR, or add yourself to the ruleset bypass list |
| SSH deploy: `Permission denied` | Key mismatch or wrong user | Verify `key.pem` works locally, confirm `SERVER_SSH_KEY` matches, check Security Group |
| `docker: not found` on EC2 | Docker not installed or no permissions | `sudo apt install docker.io && sudo usermod -aG docker $USER`, then reconnect |
| 30–60s first load on Azure | Free F1 cold start | Expected; upgrade to B1 tier with **Always On** to avoid |
