#!/usr/bin/env bash
sudo systemctl disable --now dynds.timer
[[ -e /usr/local/bin/dyndns ]] && sudo rm -f /usr/local/bin/dyndns
[[ -e /usr/local/bin/dyndns-start.sh ]] && sudo rm -f /usr/local/bin/dyndns-start.sh
# [[ -e /etc/dyndns.env ]] && sudo rm -f /etc/dyndns.env
[[ -e /etc/systemd/system/dyndns.service ]] && sudo rm -f /etc/systemd/system/dyndns.service
[[ -e /etc/systemd/system/dyndns.timer ]] && sudo rm -f /etc/systemd/system/dyndns.timer
printf "finished uninstall"
