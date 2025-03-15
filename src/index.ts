import { main } from "./main.ts";

try {
  await main();
  Deno.exit(0);
} catch (err) {
  console.error(err);
  Deno.exit(1);
}
