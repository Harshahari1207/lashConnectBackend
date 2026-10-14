
import type { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";

const publicFields =
  "name email phone city role isActive createdAt updatedAt";

export const getMyProfile = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = await User.findById(req.user!.id)
      .select(publicFields);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load profile",
    });
  }
};

export const updateMyProfile = async (
  req: Request,
  res: Response,
) => {
  try {
    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    const allowedFields = ["name", "phone", "city"];

    const providedFields = Object.keys(body);

    if (
      providedFields.length === 0 ||
      providedFields.some(
        (field) => !allowedFields.includes(field),
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only name, phone, and city can be updated",
      });
    }

    const updates: Record<string, string> = {};

    for (const field of providedFields) {
      if (typeof body[field] !== "string") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string`,
        });
      }

      updates[field] = body[field].trim();
    }

    if (
      updates.name !== undefined &&
      (updates.name.length < 2 ||
        updates.name.length > 100)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain between 2 and 100 characters",
      });
    }

    if (
      updates.phone !== undefined &&
      updates.phone !== "" &&
      !/^\+?[0-9 ()-]{7,20}$/.test(updates.phone)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number",
      });
    }

    if (
      updates.city !== undefined &&
      updates.city.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "City must be at most 100 characters",
      });
    }

    if (!mongoose.isValidObjectId(req.user!.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.user!.id,
        isActive: true,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).select(publicFields);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};
