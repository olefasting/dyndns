import "dotenv/config";
import fetch from "node-fetch";
import { createClient } from "digitalocean-api-client";

if (process.env.DISABLE_DYNDNS && process.env.DISABLE_DYNDNS === "1") {
	console.log("dyndns disabled (DISABLE_DYNDNS is set to '1')");
	process.exit(0);
}

const domain = process.env.DOMAIN;

const client = createClient({
	token: process.env.DOTOKEN,
});

const records_res = await client.GET("/v2/domains/{domain_name}/records", {
	params: {
		path: {
			domain_name: process.env.DOMAIN,
		},
		query: {
			name: process.env.SUBDOMAIN,
			type: "A",
		},
	},
});

if (records_res.error) {
	console.error("error when retrieving existing record: ", records_res.error);
	process.exit(1);
} else if (
	!records_res.data ||
	!records_res.data.domain_records ||
	records_res.data.domain_records.length < 1
) {
	console.error(
		"server returned an invalid response or an empty list of domain records",
	);
	process.exit(1);
}

const echo_ip_url = process.env.ECHO_IP_URL || "https://api.ipify.org:";
const record = records_res.data.domain_records[0];
const ip_res = await fetch(echo_ip_url);

const record_id = record.id;

const current_ip = (await ip_res.text()).trim();
const record_ip = record.data.trim();

if (current_ip === record_ip) {
	console.log(`DNS record is already pointing to your IP (${current_ip})`);
	process.exit(0);
}

const update_res = await client.PUT(
	"/v2/domains/{domain_name}/records/{record_id}",
	{
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		params: {
			path: {
				domain_name: domain,
				record_id: record_id,
			},
		},
		body: {
			type: "A",
			data: current_ip.trim(),
		},
	},
);

if (update_res.error) {
	console.error("error when updating existing record", update_res.error);
	process.exit(1);
} else if (!update_res.data) {
	console.error("server returned an invalid response");
	process.exit(1);
}

const updated_record = update_res.data.domain_record;

console.log(`the record IP set to ${updated_record.data}`);
