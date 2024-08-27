@echo off
:: Menentukan direktori proyek sebagai direktori tempat file batch berada
set "projectDir=%~dp0"

:: Mengubah direktori ke path proyek
cd /d "%projectDir%"

:: Menjalankan server Node.js di background
start /b node server.js

:: Menunggu server untuk memulai
timeout /t 5 /nobreak >nul

:: Membuka halaman index.html di browser
start "" "http://localhost:3000/"

:: Menunggu pengguna menekan tombol untuk menutup jendela
pause
