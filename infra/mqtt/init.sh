#!/bin/sh
set -e

if [ ! -f /mosquitto/config/passwd ]; then
  mosquitto_passwd -b -c /mosquitto/config/passwd "admin" "admin123456"
  chown mosquitto:mosquitto /mosquitto/config/passwd
fi

exec mosquitto -c /mosquitto/config/mosquitto.conf
