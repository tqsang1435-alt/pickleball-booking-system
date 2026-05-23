import jwt from "jsonwebtoken";

export const generateToken = (payload: any) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || "pcs_secret",
    {
      expiresIn: "24h",
    }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || "pcs_secret"
  );
};