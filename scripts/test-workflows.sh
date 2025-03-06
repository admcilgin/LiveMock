#!/bin/bash

# LiveMock Desktop Build Workflow Test Script
# Bu script, GitHub Actions workflow'larını yerel olarak test etmek için kullanılır.

echo "LiveMock Desktop Build Workflow Test Script"
echo "----------------------------------------"

# Gerekli paketlerin yüklü olup olmadığını kontrol et
if ! command -v act &> /dev/null
then
    echo "act komutu bulunamadı. Lütfen yükleyin: https://github.com/nektos/act"
    exit 1
fi

# Workflow'ları test et
echo "Desktop Build workflow'unu test ediliyor..."
act -j build-mac,build-windows,build-linux -W .github/workflows/desktop-build.yml --dryrun

echo ""
echo "Desktop Release workflow'unu test ediliyor..."
act -j create-release,build-mac,build-windows,build-linux -W .github/workflows/desktop-release.yml --dryrun

echo ""
echo "Test tamamlandı."
echo "Gerçek bir test çalıştırmak için --dryrun parametresini kaldırın."
echo "Örnek: act -j build-mac -W .github/workflows/desktop-build.yml" 