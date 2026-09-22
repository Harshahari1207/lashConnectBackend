import User from "../models/User";
import {
  comparePassword,
  hashPassword
} from "../utils/password";

import {
  generateToken
} from "../utils/jwt";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const normalizedEmail =
    email.toLowerCase().trim();

  const existing =
    await User.findOne({
      email: normalizedEmail
    });

  if (existing) {
    throw new Error(
      "Email is already registered"
    );
  }

  const hashedPassword =
    await hashPassword(password);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: "viewer"
  });

  const token =
    generateToken({
      userId: user.id,
      role: user.role
    });

  return {
    token,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const normalizedEmail =
    email.toLowerCase().trim();

  const user =
    await User.findOne({
      email: normalizedEmail
    }).select("+password");

  if (!user) {
    throw new Error(
      "Invalid email or password"
    );
  }

  if (!user.isActive) {
    throw new Error(
      "Account is disabled"
    );
  }

  const valid =
    await comparePassword(
      password,
      user.password
    );

  if (!valid) {
    throw new Error(
      "Invalid email or password"
    );
  }

  const token =
    generateToken({
      userId: user.id,
      role: user.role
    });

  return {
    token,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};