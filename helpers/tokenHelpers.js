import key from "../config/key.js";
import { redisClient } from "../config/redisClient.js";
import { $env } from "../env.js";
import jwt from "jsonwebtoken";

export function createAccessToken({ userData }) {
   return jwt.sign(userData, $env.ACCESS_TOKEN_SECRET, {
      expiresIn: $env.ACCESS_TOKEN_EXP,
   });
}

export function createRefreshToken({ userData }) {
   const refreshToken = jwt.sign(userData, $env.REFRESH_TOKEN_SECRET, {
      expiresIn: `${$env.REFRESH_TOKEN_EXP}d`,
   });

   redisClient.rPush("refreshToken:" + userData._id, refreshToken);

   return refreshToken;
}

export async function verifyRefreshToken(refreshToken) {
   const decodedToken = jwt.verify(refreshToken, $env.REFRESH_TOKEN_SECRET);

   const tokenStatus = await redisClient.lRange(
      `${key.REFRESH_TOKEN}:${decodedToken._id}`,
      0,
      -1
   );
   
   if (!tokenStatus?.length) {
      return {
         tokenDetails: null,
         error: true,
         message: "Invalid refresh token",
      };
   }
   delete decodedToken.exp;
   return {
      tokenDetails: decodedToken,
      error: false,
      message: "Valid refresh token",
   };
}

export function getRefreshTokenExp() {
   const expiryInSec = 60 * 60 * 24 * $env.REFRESH_TOKEN_EXP;
   const currentDate = new Date();
   return new Date(currentDate.getTime() + expiryInSec * 1000);
}
