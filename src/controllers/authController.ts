import {
  Request,
  Response
} from "express";

import {
  loginUser,
  registerUser
} from "../services/authService";

export const register = async (
  req: Request,
  res: Response
) => {
  const {
    name,
    email,
    password
  } = req.body;

  if (
    !name ||
    !email ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Name, email and password are required"
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message:
        "Password must contain at least 8 characters"
    });
  }

  const result =
    await registerUser(
      name,
      email,
      password
    );

  return res.status(201).json({
    success: true,
    data: result
  });
};

export const login = async (
  req: Request,
  res: Response
) => {
  const {
    email,
    password
  } = req.body;

  if (
    !email ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Email and password are required"
    });
  }

  const result =
    await loginUser(
      email,
      password
    );

  return res.json({
    success: true,
    data: result
  });
};