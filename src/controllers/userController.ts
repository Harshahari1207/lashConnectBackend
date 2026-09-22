import {
  Request,
  Response
} from "express";

import User from "../models/User";

export const getUsers =
  async (
    _req: Request,
    res: Response
  ) => {
    const users =
      await User.find()
        .select(
          "-password"
        )
        .sort({
          createdAt: -1
        });

    return res.json({
      success: true,
      data: users
    });
  };

export const updateUserRole =
  async (
    req: Request,
    res: Response
  ) => {
    const {
      role
    } = req.body;

    if (
      ![
        "admin",
        "operator",
        "viewer"
      ].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    const user =
      await User.findByIdAndUpdate(
        req.params.id,
        {
          role
        },
        {
          new: true
        }
      ).select(
        "-password"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      data: user
    });
  };