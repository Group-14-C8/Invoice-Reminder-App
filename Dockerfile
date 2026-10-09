# ---------- Stage 1: Build the frontend (Vite) ----------
FROM node:20-alpine AS frontend
WORKDIR /fe

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
# Vite outputs to ./dist by default. If yours is different, adjust below.

# ---------- Stage 2: Build the API ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/InvoiceApp.Api/InvoiceApp.Api.csproj src/InvoiceApp.Api/
RUN dotnet restore src/InvoiceApp.Api/InvoiceApp.Api.csproj

COPY . .

# Copy the built frontend into wwwroot so the API serves it
COPY --from=frontend /fe/dist ./src/InvoiceApp.Api/wwwroot

RUN dotnet publish src/InvoiceApp.Api/InvoiceApp.Api.csproj -c Release -o /app/publish

# ---------- Stage 3: Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

RUN mkdir -p /app/data
ENTRYPOINT ["dotnet", "InvoiceApp.Api.dll"]
