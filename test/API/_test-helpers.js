import { init } from "../../src/server.js";

export async function createTestServer() {
  return await init();
}
