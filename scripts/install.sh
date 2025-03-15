#!/usr/bin/env bash
[[ -e build/dyndns ]] || ./scripts/build.sh
if [[ ! -e build/dyndns ]]; then
  printf "unable to find binaries after compile" >&2
  exit 1
fi

sudo cp build/dyndns /usr/local/bin/dyndns
sudo chown root:root /usr/local/bin/dyndns
sudo chmod 775 /usr/local/bin/dyndns

sudo cp scripts/start.sh /usr/local/bin/dyndns-start.sh
sudo chown root:root /usr/local/bin/dyndns-start.sh
sudo chmod 775 /usr/local/bin/dyndns-start.sh

if [[ ! -e /etc/dyndns.env ]]; then
  if [[ -e .env ]]; then
    printf "using .env file from current working directory (%s) as /etc/dyndns.env" "$PWD"
    sudo cp .env /etc/dyndns.env
  else
    _dotoken="${DOTOKEN:-${DYNDNS_DOTOKEN}}"
    [[ -n "$_dotoken" ]] && _dotoken_safe="<hidden>"
    _records="${RECORDS:-${DYNDNS_RECORDS:-home.kaliyuga.io,oasf.kaliyuga.io}}"
    printf "no .env file found, creating /etc/dyndns.env based on current environment (records: %s, dotoken: %s)" "$_records" "${_dotoken_safe:-<none>}"
    if [[ -z "$_dotoken" ]]; then
      echo "DYNDNS_RECORDS=$_records" >dyndns.env
      echo "DYNDNS_DOTOKEN=$_dotoken" >>dyndns.env
    fi
    sudo mv dyndns.env /etc/dyndns.env
    unset _dotoken _dotoken_safe _records
  fi
  sudo chown root:root /etc/dyndns.env
  sudo chmod 664 /etc/dyndns.env
fi
sudo cp dyndns.service /etc/systemd/system/dyndns.service
sudo chown root:root /etc/systemd/system/dyndns.service

sudo cp dyndns.timer /etc/systemd/system/dyndns.timer
sudo chown root:root /etc/systemd/system/dyndns.timer

printf "finished install, use 'systemctl enable --now dyndns.timer' to enable and start the service"
