import express from "express";
import { createUser, getUserByEmail } from "../helpers/userHelpers.js";
import {
   comparePassword,
   createOrUpsertUserGoogle,
   hashPassword,
   validateEmail,
   validatePassword,
} from "../helpers/authHelpers.js";
import { OAuth2Client } from "google-auth-library";
import {
   createAccessToken,
   createRefreshToken,
   getRefreshTokenExp,
   verifyRefreshToken,
} from "../helpers/tokenHelpers.js";
import key from "../config/key.js";
import { $env } from "../env.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/sign-up", async (req, res) => {
   try {
      const userData = req.body;

      if (!(userData.email && userData.password)) {
         res.status(400).json({
            error: true,
            msg: "Email and password are required!",
         });
         return;
      }

      // validating email and password
      if (!validateEmail(userData.email))
         return res.status(400).json({ error: true, msg: "Invalid email" });
      if (!validatePassword(userData.password))
         return res.status(400).json({ error: true, msg: "Invalid password" });

      let hashedPassword = undefined;

      try {
         hashedPassword = hashPassword({ password: userData.password });
      } catch (error) {
         console.error(error);
         res.status(500).json({
            error: true,
            msg: "Server Error: Failed to hash password!",
         });
         return;
      }

      // checking if the sign-up is called by and admin
      const signUpByAdmin = req?.session?.user?.role === "admin" ? true : false;

      const newUser = {
         name: { firstName: userData.firstName, lastName: userData.lastName },
         email: userData.email,
         password: hashedPassword,
         role: signUpByAdmin ? userData.role : "user", // if the sign-up is done by an admin, then use the role set by the admin.
      };

      try {
         await createUser(newUser);
      } catch (error) {
         if (error.code === 11000)
            return res.status(400).json({
               error: true,
               msg: "User with this email already exist!",
               code: "DuplicateUser",
            });
         else {
            res.status(500).json({
               error: true,
               msg: "Server Error: Failed to create user!",
            });
            console.error(error);
            return;
         }
      }
      res.status(201).json({ error: false, msg: "User created successfully!" });
   } catch (error) {
      res.status(500).json({
         error: true,
         msg: "Server Error: Failed to create user",
      });
      console.error(error);
   }
});

router.post("/login", async (req, res) => {
   const { email, password } = req.body;

   // check if email and password exist
   if (!(email && password)) {
      return res.status(400).json({
         error: true,
         msg: "Email and password are required",
      });
   }

   // validating email and password
   if (!validateEmail(email))
      return res.status(400).json({ error: true, msg: "Invalid email" });
   if (!validatePassword(password))
      return res.status(400).json({ error: true, msg: "Invalid password" });

   // check if user exists
   const user = await getUserByEmail(email);
   if (!user)
      return res.status(401).json({
         msg: "User not registered!",
         error: true,
         code: "UnknownUser",
      });

   if (!user?.password) {
      return res.status(401).json({
         msg: "User not registered with password!",
         error: true,
         code: "NoPasswordUser",
      });
   }

   const isMatch = comparePassword({ password, hash: user.password });

   if (!isMatch)
      return res.status(401).json({
         msg: "Invalid credentials!",
         error: true,
         code: "InvalidCredential",
      });

   delete user.password;

   const accessToken = createAccessToken({ userData: user });

   const refreshToken = createRefreshToken({ userData: user });

   res.cookie(`${key.REFRESH_TOKEN}`, refreshToken, {
      httpOnly: true,
      secure: true,
      expires: getRefreshTokenExp(),
      sameSite: "strict",
   });

   res.status(200).send({ accessToken, user });
});

router.post("/google/one-tap", async (req, res) => {
   const { credential } = req.body;

   const client = new OAuth2Client($env.CLIENT_ID);

   try {
      // Verify the ID token using the OAuth2Client
      const ticket = await client.verifyIdToken({
         idToken: credential,
         audience: $env.CLIENT_ID,
      });

      const payload = ticket.getPayload();

      const extractedUser = {
         email: payload.email,
         name: {
            firstName: payload.given_name,
            lastName: payload.family_name,
         },
         avatar: payload.picture,
      };

      const userData = await createOrUpsertUserGoogle(extractedUser);

      const accessToken = createAccessToken({ userData });

      const refreshToken = createRefreshToken({ userData });

      res.cookie(`${key.REFRESH_TOKEN}`, refreshToken, {
         httpOnly: true,
         secure: true,
         expires: getRefreshTokenExp(),
         sameSite: "strict",
      });

      res.status(201).json({
         error: false,
         msg: "User created successfully!",
         accessToken,
         user: userData,
      });
   } catch (error) {
      res.status(400).json({ message: "Sign-in Failed" });
      console.error("Error verifying token:", error);
   }
});

router.post("/google", (req, res) => {
   console.log(req.body);
   const { code } = req.body;
   const grant_type = "authorization_code";

   fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
         "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
         code,
         client_id: $env.CLIENT_ID,
         client_secret: $env.CLIENT_SECRET,
         redirect_uri: "postmessage",
         grant_type,
      }),
   })
      .then((response) => response.json())
      .then(async (tokens) => {
         const payload = jwt.decode(tokens.id_token);

         const extractedUser = {
            email: payload.email,
            name: {
               firstName: payload.given_name,
               lastName: payload.family_name,
            },
            avatar: payload.picture,
         };

         const userData = await createOrUpsertUserGoogle(extractedUser);

         const accessToken = createAccessToken({ userData });

         const refreshToken = createRefreshToken({ userData });

         res.cookie(`${key.REFRESH_TOKEN}`, refreshToken, {
            httpOnly: true,
            secure: true,
            expires: getRefreshTokenExp(),
            sameSite: "strict",
         });

         res.status(201).json({
            error: false,
            msg: "User created successfully!",
            accessToken,
            user: userData,
         });
      })
      .catch((error) => {
         // Handle errors in the token exchange
         console.error("Token exchange error:", error);
         res.status(500).json({ error: "Internal Server Error" });
      });
});

router.post("/refresh", async (req, res) => {
   const { refreshToken } = req.cookies || undefined;
   if (!refreshToken) {
      return res.sendStatus(403); // Forbidden if no refresh token is provided
   }

   try {
      const { tokenDetails, error, message } = await verifyRefreshToken(
         refreshToken
      );

      if (error) {
         return res.status(401).json({ error: message }); // Unauthorized if token is invalid
      }

      // Generate a new refresh token
      const newRefreshToken = createRefreshToken({ userData: tokenDetails });

      // Generate a new access token
      const newAccessToken = createAccessToken({ userData: tokenDetails });

      res.cookie(`${key.REFRESH_TOKEN}`, newRefreshToken, {
         httpOnly: true,
         secure: true,
         expires: getRefreshTokenExp(),
         sameSite: "strict",
      });

      // Respond with the new access token
      return res.json({ accessToken: newAccessToken });
   } catch (error) {
      console.error("Internal server error:", error);
      return res.status(500).json({ error: "Internal server error" });
   }
});

router.post("/logout", (req, res) => {
   res.clearCookie(key.REFRESH_TOKEN);
   res.json({ msg: "Logged out!" });
});

export default router;
