"use server";

import { cookies } from "next/headers";
import { VerifyLoginPayloadParams } from "thirdweb/auth";
import { thirdwebAuth } from "@app/lib/sdk/thirdweb/auth";

export const generatePayload = thirdwebAuth.generatePayload;

export async function login(payload: VerifyLoginPayloadParams) {
    const verifiedPayload = await thirdwebAuth.verifyPayload(payload);
    
    if (verifiedPayload.valid) {
        const jwt = await thirdwebAuth.generateJWT({
            payload: verifiedPayload.payload,
        });
        cookies().set("jwt", jwt);
    }
}

export async function authedOnly() {
  const jwt = cookies().get("jwt");
  if (!jwt?.value) {
    return false;
  }

  const authResult = await thirdwebAuth.verifyJWT({ jwt: jwt.value });
  if (!authResult.valid) {
    return false;
  }
  return true;
}

export async function logout() {
  cookies().delete("jwt");
}