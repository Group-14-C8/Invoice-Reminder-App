# Invoice & Payment-Reminder App

A web app for freelancers and small businesses to create invoices, track paid/unpaid
status, and send automatic payment reminders. Includes an admin dashboard showing
overdue totals.

## Overview
## Architecture

┌──────────────────────────────────────────────────────────────┐
│                         DEVELOPER                             │
│                                                               │
│   Writes code → git commit → git push (deployment-branch)     │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     GITHUB REPOSITORY                         │
│                                                               │
│   • Source code (React + ASP.NET Core + SQLite)               │
│   • Dockerfile                                                │
│   • .github/workflows/CICD.yaml                               │
└───────────────────────────┬──────────────────────────────────┘
                            │ triggers on push
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   GITHUB ACTIONS (CI/CD)                      │
│                                                               │
│   1. Checkout code                                            │
│   2. Log in to Docker Hub                                     │
│   3. Build Docker image (multi-stage)                         │
│   4. Push image to Docker Hub (latest + SHA tags)             │
│   5. Trigger Azure App Service to restart with new image      │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       DOCKER HUB                              │
│                                                               │
│   Image: mazakar/invoice-reminder-app:latest                  │
│   Image: mazakar/invoice-reminder-app:<commit-sha>            │
└───────────────────────────┬──────────────────────────────────┘
                            │ Azure pulls image
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              AZURE APP SERVICE (Linux, F1 tier)               │
│                                                               │
│   ┌────────────────────────────────────────────────────┐      │
│   │           Docker Container (port 8080)             │      │
│   │                                                    │      │
│   │   ┌──────────────────┐   ┌──────────────────┐      │      │
│   │   │  React Frontend  │   │  ASP.NET Core    │      │      │
│   │   │  (in wwwroot)    │   │  Web API         │      │      │
│   │   └──────────────────┘   └────────┬─────────┘      │      │
│   │                                    │                │      │
│   │                                    ▼                │      │
│   │                          ┌──────────────────┐       │      │
│   │                          │  SQLite Database │       │      │
│   │                          │  (/app/data)     │       │      │
│   │                          └──────────────────┘       │      │
│   └────────────────────────────────────────────────────┘      │
│                                                               │
│   Public URL: https://invoice-reminder.azurewebsites.net      │
└──────────────────────────────────────────────────────────────┘

## Tech stack
## Run locally
## Environment variables

Environment variables are runtime configuration values injected into the container by the operating system, used instead of hardcoding secrets or environment-specific settings. In .NET, they override values in appsettings.json using a double-underscore convention (Jwt__Key maps to Jwt:Key). In this project, Azure App Service uses the WEBSITES_PORT=8080 variable to route traffic to the correct container port. This approach keeps sensitive values (JWT keys, database credentials) out of source control and allows the same Docker image to run in different environments without modification.

## CI/CD workflow

### The CI/CD pipeline is implemented with GitHub Actions in .github/workflows/CICD.yaml. It triggers automatically on every push to the deployment-branch. The workflow runs five steps on a fresh Ubuntu runner:

1. Checkout: pulls the repo onto the runner

2. Docker Hub login: authenticates using GitHub Secrets

3. Build and push: builds the multi-stage Docker image and pushes it to Docker Hub with two tags (latest and the commit SHA)

4. SSH deploy: disabled (if: false), retained as an alternative deployment option

5. Azure deploy: tells Azure App Service to pull the newly built image and restart

The SHA tag is used for the Azure deployment to force Azure to pull a fresh image on every run, avoiding stale-cache issues with the latest tag. This setup achieves full automation: a single git push builds, ships, and deploys the application with no manual steps.


## Deployment (Azure App Service + staging slot)

The application is deployed to Azure App Service using the Docker Container publish method. Azure pulls the image from Docker Hub and runs it on a managed Linux host, exposing it via  https://invoice-reminder-akbnezbxdvh4axg6.australiaeast-01.azurewebsites.net/login with automatically provisioned HTTPS. Deployment is authenticated via a Publish Profile (XML credentials) stored as a GitHub Secret.

The WEBSITES_PORT=8080 application setting is configured in Azure to match the container's listening port.

Regarding staging slots: Azure App Service supports deployment slots for zero-downtime (blue-green) deployments — new versions can be deployed to a staging slot, tested, and then swapped into production instantly. However, slots require a Standard S1 or higher App Service Plan. This project uses the Free F1 tier for cost reasons, which does not support slots. As a result, deployments currently target the production slot directly, causing a brief restart during each release. For a production-grade setup, upgrading the tier and adding a slot-name: staging parameter to the webapps-deploy step would enable safe, zero-downtime releases.

## Health check and monitoring
## Troubleshooting
