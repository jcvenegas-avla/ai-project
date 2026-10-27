#!/usr/bin/env bash
# Descarga JMeter y un JDK 17 (Eclipse Temurin) en jmeter/ para el agente /reversa.
# Funciona en Linux (glibc) y macOS, x86_64 y ARM. No instala nada fuera de esa carpeta.
#
# Uso (desde cualquier carpeta):
#   bash scripts/setup-jmeter.sh
set -euo pipefail

JMETER_VERSION="5.4.3"
JDK_TAG="jdk-17.0.3+7"          # release de Temurin
JDK_FILE_VER="17.0.3_7"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/jmeter"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

case "$(uname -s)" in
  Linux)  OS=linux ;;
  Darwin) OS=mac ;;
  *) echo "SO no soportado: $(uname -s). Usa Linux, macOS o WSL." >&2; exit 1 ;;
esac
case "$(uname -m)" in
  x86_64|amd64)  ARCH=x64 ;;
  aarch64|arm64) ARCH=aarch64 ;;
  *) echo "Arquitectura no soportada: $(uname -m)" >&2; exit 1 ;;
esac

# Comprueba el checksum con sha*sum (Linux) o shasum (macOS).
check_sum() {
  local bits="$1" expected="$2" file="$3"
  if command -v "sha${bits}sum" >/dev/null 2>&1; then
    echo "$expected  $file" | "sha${bits}sum" -c -
  else
    echo "$expected  $file" | shasum -a "$bits" -c -
  fi
}

mkdir -p "$DEST"

# --- JMeter ---
JMETER_HOME="$DEST/apache-jmeter-$JMETER_VERSION"
if [ -x "$JMETER_HOME/bin/jmeter" ]; then
  echo "JMeter $JMETER_VERSION ya está en $JMETER_HOME"
else
  url="https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-$JMETER_VERSION.tgz"
  echo "Descargando JMeter $JMETER_VERSION..."
  curl -fL -o "$TMP/jmeter.tgz" "$url"
  check_sum 512 "$(curl -fsL "$url.sha512" | awk '{print $1}')" "$TMP/jmeter.tgz"
  tar -xzf "$TMP/jmeter.tgz" -C "$DEST"
fi

# --- JDK 17 ---
JDK_HOME="$DEST/jdk-17"
if [ -x "$JDK_HOME/bin/java" ]; then
  echo "JDK 17 ya está en $JDK_HOME"
else
  file="OpenJDK17U-jdk_${ARCH}_${OS}_hotspot_${JDK_FILE_VER}.tar.gz"
  url="https://github.com/adoptium/temurin17-binaries/releases/download/${JDK_TAG/+/%2B}/$file"
  echo "Descargando JDK ($file)..."
  curl -fL -o "$TMP/jdk.tgz" "$url"
  check_sum 256 "$(curl -fsL "$url.sha256.txt" | awk '{print $1}')" "$TMP/jdk.tgz"
  tar -xzf "$TMP/jdk.tgz" -C "$TMP"
  src="$TMP/$JDK_TAG"
  [ "$OS" = mac ] && src="$src/Contents/Home"
  mv "$src" "$JDK_HOME"
fi

"$JDK_HOME/bin/java" -version
JAVA_HOME="$JDK_HOME" "$JMETER_HOME/bin/jmeter" --version | tail -n 3
echo
echo "Listo:"
echo "  JAVA_HOME=$JDK_HOME"
echo "  JMeter:   $JMETER_HOME/bin/jmeter"
