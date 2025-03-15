import { createApiClient } from "dots-wrapper";

export async function main() {
  const records: string[] = (Deno.env.get("DYNDNS_RECORDS") || "")
    .split(",")
    .filter((v) => v !== "");
  if (records.length === 0) {
    throw new Deno.errors.InvalidData(
      "records could not be found in env (use DYNDNS_RECORDS or a .env file)",
    );
  }

  const dotoken = Deno.env.get("DYNDNS_DOTOKEN");
  if (!dotoken) {
    throw new Deno.errors.InvalidData(
      "dotoken could not be found in env (use DYNDNS_DOTOKEN or a .env file)",
    );
  }

  const dots = createApiClient({ token: dotoken });

  const ip_url = Deno.env.get("DYNDNS_IP_URL") || "https://api.ipify.org";

  const ip_res = await fetch(ip_url);

  const current_ip = (await ip_res.text()).trim();

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
              console.info(`created new record for '${record}'`, domain_record);
            } catch (err) {
              throw new Deno.errors.Http(
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
              console.info(
                `updated existing record for '${record}'`,
                domain_record,
              );
            } catch (err) {
              throw new Deno.errors.Http(
                `error when updating existing record for '${record}': ${err}`,
              );
            }
          } else {
            console.info(`record for '${record}' already points to current ip`);
          }
        } catch (err) {
          throw new Deno.errors.Http(
            `error when listing domain records for domain '${domain_name}': ${err}`,
          );
        }
      }
    }
  } catch (err) {
    throw new Deno.errors.Http(`error when listing domains: ${err}`);
  }
}
