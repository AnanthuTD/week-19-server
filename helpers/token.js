import redisClient from '../config/redisClient.js'
import { $env } from "../env.js";
export function createAccessToken({ userData }) {
   return jwt.sign(userData, accessTokenPrivateKey, {
      expiresIn: "15m",
   });
}

export function createRefreshToken({ userData }) {
   const payload = {
      id: userData.id,
      role: userData.role,
   };

   const refreshToken = jwt.sign(payload, $env.REFRESH_TOKEN_SECRET, {
      expiresIn: `${$env.REFRESH_TOKEN_EXP}d`,
   });

   return refreshToken;

   // TODO: STORE REFRESH TOKEN IN DATABASE FOR INVALIDATING
}

export async function invalidateRefreshToken(token, expiresIn) {
   await redisClient.set(token, "invalid", { EX: expiresIn });
}

export async function verifyRefreshToken(refreshToken) {
   const tokenStatus = await redisClient.get(refreshToken);
   if (tokenStatus === "invalid") {
      return {
         tokenDetails: null,
         error: true,
         message: "Invalid refresh token",
      };
   }
   const decodedToken = jwt.verify(refreshToken, $env.REFRESH_TOKEN_SECRET);
   return {
      tokenDetails: decodedToken,
      error: false,
      message: "Valid refresh token",
   };
}
