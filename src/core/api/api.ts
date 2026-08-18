import { env } from "../../config/env";
import { MockApiClient } from "../../mocks/MockApiClient";
import { HttpApiClient } from "./HttpApiClient";

export const api = env.useMocks
    ? new MockApiClient()
    : new HttpApiClient();
