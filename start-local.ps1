# Script de démarrage local pour Money Making Machine (Aura B2B)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Démarrage Local de Aura B2B " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# 1. Vérification du fichier .env
if (-Not (Test-Path ".env")) {
    Write-Host "[!] Fichier .env manquant. Copie depuis .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[+] Fichier .env créé. N'oubliez pas de le configurer." -ForegroundColor Green
} else {
    Write-Host "[+] Fichier .env détecté." -ForegroundColor Green
}

# 2. Lancement des conteneurs (Postgres + Redis)
Write-Host "[*] Lancement de Docker Compose (Postgres, Redis)..." -ForegroundColor Cyan
docker-compose up -d

# Attendre que les bases soient prêtes (simple délai de sécurité)
Write-Host "[*] Attente (5s) pour l'initialisation des bases de données..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Synchronisation Base de données
Write-Host "[*] Synchronisation de la base de données Prisma..." -ForegroundColor Cyan
npx prisma db push

# (Optionnel) Vérification d'Ollama local
$ollamaRunning = (Get-Process "ollama" -ErrorAction SilentlyContinue)
if (-Not $ollamaRunning) {
    Write-Host "[!] ATTENTION : Ollama ne semble pas en cours d'exécution." -ForegroundColor Yellow
    Write-Host "    Pensez à lancer 'ollama serve' ou l'application Ollama si nécessaire." -ForegroundColor Yellow
} else {
    Write-Host "[+] Processus Ollama détecté." -ForegroundColor Green
}

# 4. Lancement du système (Frontend + Worker concurrent)
Write-Host "[*] Démarrage des serveurs (App + Worker)..." -ForegroundColor Cyan
npm run dev
