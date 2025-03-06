#!/bin/bash

# LiveMock Desktop Workflow Debug Script
# Bu script, GitHub Actions workflow'larında sorun gidermek için kullanılır.

echo "LiveMock Desktop Workflow Debug Script"
echo "----------------------------------------"

# Parametreleri kontrol et
if [ $# -lt 1 ]; then
    echo "Kullanım: $0 <workflow_file> [job_name]"
    echo "Örnek: $0 desktop-build.yml build-mac"
    exit 1
fi

WORKFLOW_FILE=$1
JOB_NAME=${2:-""}

# Workflow dosyasının varlığını kontrol et
if [ ! -f ".github/workflows/$WORKFLOW_FILE" ]; then
    echo "Hata: .github/workflows/$WORKFLOW_FILE dosyası bulunamadı."
    exit 1
fi

# Gerekli paketlerin yüklü olup olmadığını kontrol et
if ! command -v act &> /dev/null
then
    echo "act komutu bulunamadı. Lütfen yükleyin: https://github.com/nektos/act"
    exit 1
fi

# Debug modunda çalıştır
if [ -z "$JOB_NAME" ]; then
    echo "Tüm işleri debug modunda çalıştırıyor..."
    act -W .github/workflows/$WORKFLOW_FILE --dryrun -v
else
    echo "$JOB_NAME işini debug modunda çalıştırıyor..."
    act -j $JOB_NAME -W .github/workflows/$WORKFLOW_FILE --dryrun -v
fi

echo ""
echo "Debug tamamlandı."
echo "Gerçek bir test çalıştırmak için --dryrun parametresini kaldırın."
echo "Örnek: act -j $JOB_NAME -W .github/workflows/$WORKFLOW_FILE -v" 