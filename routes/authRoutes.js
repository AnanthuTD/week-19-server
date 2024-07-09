import express from "express";
import { createUser, getUserByEmail } from "../helpers/userHelpers.js";
import {
   comparePassword,
   createOrUpsertUserGoogle,
   hashPassword,
   linkSessionAndUser,
   validateEmail,
   validatePassword,
} from "../helpers/authHelpers.js";
import { OAuth2Client } from "google-auth-library";
import {
   createAccessToken,
   createRefreshToken,
   verifyRefreshToken,
} from "../helpers/token.js";
import { $env } from "../env.js";
const router = express.Router();

router.get("/", (req, res) => {
   const { user } = req.session;
   return res.status(201).json({ user });
});

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

   const isMatch = comparePassword({ password, hash: user.password });

   if (!isMatch)
      return res.status(401).json({
         msg: "Invalid credentials!",
         error: true,
         code: "InvalidCredential",
      });

   const accessToken = createAccessToken({ userData: user });

   const refreshToken = createRefreshToken({ userData });

   const expiryInSec = 60 * 60 * 24 * $env.REFRESH_TOKEN_EXP;

   const currentDate = new Date();
   const expirationDate = new Date(currentDate.getTime() + expiryInSec * 1000);

   res.cookie(`${key.REFRESH_TOKEN}`, refreshToken, {
      httpOnly: true,
      secure: true,
      expires: expirationDate,
      sameSite: "strict",
   });

   res.status(200).send({ accessToken });
});

router.post("/sign-in/google", async (req, res) => {
   const { credential } = req.body;
   const idToken = credential;

   const { CLIENT_ID } = process.env;

   const client = new OAuth2Client(CLIENT_ID);

   try {
      // Verify the ID token using the OAuth2Client
      const ticket = await client.verifyIdToken({
         idToken,
         audience: CLIENT_ID,
      });

      const payload = ticket.getPayload();

      const extractedUser = {
         email: payload.email,
         name: {
            firstName: payload.given_name,
            lastName: payload.family_name,
         },
      };

      const userData = await createOrUpsertUserGoogle(extractedUser);

      const accessToken = createAccessToken({ userData });

      const refreshToken = await createRefreshToken({ userData });

      const expiryInSec = 60 * 60 * 24 * $env.REFRESH_TOKEN_EXP;

      const currentDate = new Date();
      const expirationDate = new Date(
         currentDate.getTime() + expiryInSec * 1000
      );

      res.cookie(`${key.REFRESH_TOKEN}`, refreshToken, {
         httpOnly: true,
         secure: true,
         expires: expirationDate,
         sameSite: "strict",
      });

      res.status(201).json({
         error: false,
         msg: "User created successfully!",
         user,
      });
   } catch (error) {
      res.status(400).json({ message: "Sign-in Failed" });
      console.error("Error verifying token:", error);
   }
});

router.post("/refresh", async (req, res) => {
   const { refreshToken } = req.cookies;
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

      const payload = {
         id: tokenDetails.id,
         role: tokenDetails.role,
      };

      // Generate a new refresh token
      const newRefreshToken = createRefreshToken(payload);

      // Generate a new access token
      const newAccessToken = jwt.sign(
         payload,
         process.env.ACCESS_TOKEN_PRIVATE_KEY,
         {
            expiresIn: $env.ACCESS_TOKEN_EXP,
         }
      );

      // Set the new refresh token in the cookies
      res.cookie("refreshToken", newRefreshToken, {
         httpOnly: true,
         secure: true,
         sameSite: "Strict",
      });

      // Respond with the new access token
      return res.json({ accessToken: newAccessToken });
   } catch (error) {
      logger.error("Internal server error:", error);
      return res.status(500).json({ error: "Internal server error" });
   }
});

router.post("/logout", (req, res) => {
   req.session.destroy();
   res.json({ msg: "Logged out!" });
});

export default router;
