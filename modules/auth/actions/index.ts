"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        accounts: true,
      },
    });
    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAccountByUserId = async (userId: string) => {
  try {
    const account = await db.account.findFirst({
      where: {
        userId,
      },
    });

    return account;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getOrCreateGuestUser = async () => {
  try {
    const guestEmail = "guest@vibecode.dev";
    let guest = await db.user.findUnique({ where: { email: guestEmail } });
    if (!guest) {
      guest = await db.user.create({
        data: {
          email: guestEmail,
          name: "Guest Developer",
          image: "https://avatar.vercel.sh/guest",
          role: "USER",
        },
      });
    }
    return guest;
  } catch (error) {
    console.error("Error creating/retrieving guest user:", error);
    return null;
  }
};

export const currentUser = async () => {
  try {
    const session = await auth();
    if (session?.user && session.user.id) {
      return session.user;
    }
    // Return guest user for demo and unauthenticated access
    const guest = await getOrCreateGuestUser();
    return guest;
  } catch (error) {
    console.error("Error getting current user:", error);
    return await getOrCreateGuestUser();
  }
};