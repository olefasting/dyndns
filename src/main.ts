import "dotenv/config";
import fetch from "node-fetch";
import { createClient } from "digitalocean-api-client";

if (process.env.DYNDNS_DISABLE && process.env.DYNDNS_DISABLE === "1") {
	console.log("dyndns disabled (DYNDNS_DISABLE is set to '1')");
	process.exit(0);
}

const domains = process.env.DYNDNS_DOMAINS;
if (!domains) {
	console.error(
		"domains could not be found in env (use DYNDNS_DOMAINS or a .env file)",
	);
	process.exit(1);
}

const dotoken = process.env.DYNDNS_DOTOKEN;
if (!dotoken) {
	console.error(
		"dotoken could not be found in env (use DYNDNS_DOTOKEN or a .env file)",
	);
	process.exit(1);
}

const client = createClient({
	token: dotoken,
});

for (const rec of domains.split(",")) {
	let domain: string | undefined = undefined;
	let subdomain: string | undefined = undefined;
	let segments = rec.split(".");
	if (segments.lenth > 2) domain = segments.join(".");
	const records_res = await client.GET("/v2/domains/{domain_name}/records", {
		params: {
			path: {
				domain_name: "kaliyuga.io", //domain,
			},
			query: {
				name: "home.kaliyuga.io", //subdomain,
				type: "A",
			},
		},
	});

	if (records_res.error && records_res.response.status !== 404) {
		console.error("error when retrieving existing record", records_res.error);
		process.exit(1);
	} else if (
		records_res.response.status !== 404 &&
		(!records_res.data ||
			!records_res.data.domain_records ||
			records_res.data.domain_records.length <= 0)
	) {
		console.error(
			"server returned an invalid response or an empty list of domain records",
			records_res,
		);
		process.exit(1);
	}

	const echo_ip_url = process.env.DYNDNS_ECHO_IP_URL || "https://api.ipify.org";
	console.log("before", records_res);
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
		console.error("server returned an invalid response", update_res.data);
		process.exit(1);
	}

	const updated_record = update_res.data.domain_record;
}
