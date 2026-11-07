
#!/bin/sh

isPackageInstalled() {
    packageName="$1"

    if dpkg-query -W -f='${db:Status-Abbrev}' "$packageName" 2>/dev/null | grep -q '^ii'; then
        echo "[OK] ${packageName} is installed"
    else
        echo "[WARN] ${packageName} is not installed"
    fi
}

checkService() {
    serviceName="$1"

    if systemctl is-active --quiet "$serviceName"; then
        echo "[OK] ${serviceName} is running"
    else
        echo "[WARN] ${serviceName} is not running"
    fi
}

echo "Checking system requirements..."

echo ""
echo "Checking running services"
checkService "docker"
checkService "squid.service"

echo ""
echo "Checking installed packages"
isPackageInstalled "docker.io"
isPackageInstalled "squid"
isPackageInstalled "nodejs"
