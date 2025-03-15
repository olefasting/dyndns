# dyndns

This is a dynamic dns service that uses Digital Ocean's API to keep a set of domain name records pointing to the local system's IP address

## deno tasks

The following tasks are available:

- dev ('deno task dev') starts a dev instance with file watching enabled
- clean ('deno task clean') deletes 'build/' directory
- build ('deno task build') builds an executable in 'build/'
- install ('deno task install') installs all necessary files to the system
- enable ('deno task enable') enables the timed systemd service
- enable-now ('deno task enable-now') enables and starts the timed systemd service

## config

The service will add variables set in '/etc/dyndns.env' to the environment if they are not already specified there. The following environment variables are used:

- 'DYNDNS_DOTOKEN' should contain a valid Digital Ocean API token
- 'DYNDNS_RECORDS' should contain a string with a comma-separated list of domain names to use (FQDN required)
- 'DYNDNS_IP_URL' can be set to the url of a service that responds to requests with a client's IP (default 'https://api.ipify.org')

## license

All content in this repository is licensed under the MIT license, unless explicitly stated otherwise

Copyright 2025 Ole A. Sjo Fasting

