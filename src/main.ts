// import "@std/dotenv/load";

import { createApiClient } from "dots-wrapper";

const records: string[] = (Deno.env.get("DYNDNS_RECORDS") || "")
	.split(",")
	.filter((v) => v !== "");
if (records.length === 0) {
	console.error(
		"records could not be found in env (use DYNDNS_RECORDS or a .env file)",
	);
	Deno.exit(1);
}

const dotoken = Deno.env.get("DYNDNS_DOTOKEN");
if (!dotoken) {
	console.error(
		"dotoken could not be found in env (use DYNDNS_DOTOKEN or a .env file)",
	);
	Deno.exit(1);
}

const dots = createApiClient({ token: dotoken });

const echo_ip_url =
	Deno.env.get("DYNDNS_ECHO_IP_URL") || "https://api.ipify.org";

const ip_res = await fetch(echo_ip_url);

const current_ip = (await ip_res.text()).trim();

const main = async () => {
	console.log("checking all records");
	try {
		const {
			data: { domains },
		} = await dots.domain.listDomains({});
		for (const record of records) {
			const domain = domains.find((v) => record.endsWith(v.name));
			if (domain !== undefined) {
				const domain_name = domain.name;
				try {
					const {
						data: { domain_records },
					} = await dots.domain.listDomainRecords({
						domain_name,
						name: record,
						type: "A",
					});
					const name = record.substring(
						0,
						record.length - domain_name.length - 1,
					);
					const existing_record = domain_records.find((v) => v.name === name);
					if (existing_record === undefined) {
						try {
							const {
								data: { domain_record },
							} = await dots.domain.createDomainRecord({
								data: current_ip,
								domain_name,
								name,
								type: "A",
							});
							console.log(`created new record for '${record}'`, domain_record);
						} catch (err) {
							throw new Error(
								`error when creating record for '${record}': ${err}`,
							);
						}
					} else if (existing_record.data !== current_ip) {
						try {
							const {
								data: { domain_record },
							} = await dots.domain.updateDomainRecord({
								data: current_ip,
								domain_name,
								domain_record_id: existing_record.id,
							});
							console.log(
								`updated existing record for '${record}'`,
								domain_record,
							);
						} catch (err) {
							throw new Error(
								`error when updating existing record for '${record}': ${err}`,
							);
						}
					} else {
						console.log(`record for '${record}' already points to current ip`);
					}
				} catch (err) {
					throw new Error(
						`error when listing domain records for domain '${domain_name}': ${err}`,
					);
				}
			}
		}
	} catch (err) {
		throw `error when listing domains: ${err}`;
	}
	console.log("finished all checks");
};

try {
	await main();
	Deno.exit(0);
} catch (err) {
	console.error(err);
	Deno.exit(1);
}
