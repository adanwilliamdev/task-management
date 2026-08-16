Write-Host "🚀 Iniciando todos os serviços..." -ForegroundColor Cyan
docker-compose up --build -d
Write-Host ""
Write-Host "✅ Serviços iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Acessos:"
Write-Host "  🔍 Discovery: http://localhost:8761"
Write-Host "  🌐 Gateway: http://localhost:8080"
Write-Host "  👤 Auth: http://localhost:8081"
Write-Host "  👥 User: http://localhost:8082"
Write-Host "  📋 Task: http://localhost:8083"
Write-Host "  🔔 Notification: http://localhost:8084"
Write-Host ""
Write-Host "🎨 Frontend: cd frontend-angular && npm install && ng serve"