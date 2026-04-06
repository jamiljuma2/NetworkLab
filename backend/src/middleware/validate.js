const { z } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    req.validated = parsed.data;
    return next();
  };
}

const schemas = {
  signup: z.object({
    body: z.object({
      email: z.email(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z.enum(["Student"]).optional(),
      name: z.string().min(2).max(80),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
  }),
  login: z.object({
    body: z.object({ email: z.email(), password: z.string().min(1) }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
  }),
  startScan: z.object({
    body: z.object({
      target: z.string().trim().min(1, "Target is required"),
      scanType: z.enum(["quick", "full"]),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
  }),
};

module.exports = { validate, schemas };
