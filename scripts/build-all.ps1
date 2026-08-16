Write-Host "📦 Construindo todos os serviços..." -ForegroundColor Cyan
$services = @("discovery-service","auth-service","user-service","task-service","notification-service","api-gateway")
foreach ($service in $services) {
    Write-Host "📦 Construindo $service..." -ForegroundColor Yellow
    Set-Location $service
    mvn clean package -DskipTests
    Set-Location ..
}
Write-Host "✅ Todos os serviços construídos!" -ForegroundColor Green