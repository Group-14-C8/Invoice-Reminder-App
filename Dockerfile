# ---------- Build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files first (better layer caching)
COPY src/InvoiceApp.Api/InvoiceApp.Api.csproj src/InvoiceApp.Api/
COPY tests/InvoiceApp.Api.Tests/InvoiceApp.Api.Tests.csproj tests/InvoiceApp.Api.Tests/

# Restore
RUN dotnet restore src/InvoiceApp.Api/InvoiceApp.Api.csproj

# Copy the rest of the source
COPY . .

# Publish the API
RUN dotnet publish src/InvoiceApp.Api/InvoiceApp.Api.csproj -c Release -o /app/publish

# ---------- Runtime stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "InvoiceApp.Api.dll"]
