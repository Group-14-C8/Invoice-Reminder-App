# Invoice & Payment-Reminder App

A web app for freelancers and small businesses to create invoices, track paid/unpaid
status, and send automatic payment reminders. Includes an admin dashboard showing
overdue totals.

## Overview
## Architecture
## Tech stack
## Run locally
## Environment variables
## CI/CD workflow

# The CI/CD pipeline is implemented with GitHub Actions in .github/workflows/CICD.yaml. It triggers automatically on every push to the deployment-branch. The workflow runs five steps on a fresh Ubuntu runner:

1. Checkout: pulls the repo onto the runner

2. Docker Hub login: authenticates using GitHub Secrets

3. Build and push: builds the multi-stage Docker image and pushes it to Docker Hub with two tags (latest and the commit SHA)

4. SSH deploy: disabled (if: false), retained as an alternative deployment option

5. Azure deploy: tells Azure App Service to pull the newly built image and restart

The SHA tag is used for the Azure deployment to force Azure to pull a fresh image on every run, avoiding stale-cache issues with the latest tag. This setup achieves full automation: a single git push builds, ships, and deploys the application with no manual steps.


## Deployment (Azure App Service + staging slot)
## Health check and monitoring
## Troubleshooting
