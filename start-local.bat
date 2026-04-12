@echo off
echo ==================================
echo  Demarrage Local de Aura B2B 
echo ==================================

REM 1. Verifier le fichier .env
if not exist .env (
    echo [!] Fichier .env manquant. Copie depuis .env.example...
    copy .env.example .env
    echo [+] Fichier .env cree. N'oubliez pas de le configurer.
) else (
    echo [+] Fichier .env detecte.
)

REM 2. Lancement des conteneurs
echo [*] Lancement de Docker Compose (Postgres, Redis)...
docker-compose up -d

echo [*] Attente de 5 secondes pour l'initialisation...
timeout /t 5 /nobreak > NUL

REM 3. Synchronisation Base de donnees
echo [*] Synchronisation de la base de donnees Prisma...
call npx prisma db push

REM 4. Lancement du systeme
echo [*] Demarrage des serveurs (App + Worker)...
call npm run dev
