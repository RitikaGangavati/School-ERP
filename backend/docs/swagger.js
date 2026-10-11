const path = require("path");
const swaggerUi = require("swagger-ui-express");
const { z } = require("zod");

// Mount path -> router file. KEEP IN SYNC with app.js (add a line when you add a module).
const MOUNTS = [
  ["/api/auth", "authRT"],
  ["/api/roles", "roleRT"],
  ["/api/users", "userRT"],
  ["/api/academic-Years", "academicYearRT"],
  ["/api/sections", "sectionRT"],
  ["/api/classes", "classRT"],
  ["/api/subjects", "subjectRT"],
  ["/api/subject-groups", "subjectGroupRT"],
  ["/api/category", "categoryRT"],
  ["/api/house", "houseRT"],
  ["/api/students", "studentRT"],
  ["/api/upload", "uploadRT"],
  ["/api/teachers", "teacherRT"],
  ["/api/class-teachers", "classTeacherRT"],
  ["/api/student-promotion", "studentPromotionRT"],
  ["/api/subject-weekly-periods", "subjectWeeklyPeriodRT"],
  ["/api/time-slots", "timeSlotRT"],
  ["/api/timetables", "timeTableRT"],
  ["/api/subject-teachers", "subjectTeacherRT"],
  ["/api/attendance", "attendanceRT"],
];

// Routes that are public (no token needed)
const PUBLIC_MOUNTS = ["/api/auth"];

// Hand-written details for routes that Zod cannot describe (e.g. file uploads)
const OVERRIDES = {
  "POST /api/upload/{type}/photo": {
    summary: "Upload a photo (Cloudinary)",
    description: "Send multipart/form-data with one file in the field `photo`. JPEG, PNG or WEBP, max 5 MB.",
    parameters: [
      {
        name: "type",
        in: "path",
        required: true,
        schema: { type: "string", enum: ["students", "teachers", "general"] },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["photo"],
            properties: { photo: { type: "string", format: "binary" } },
          },
        },
      },
    },
  },
};

const VERBS = {
  create: "Create",
  list: "List",
  details: "Get details",
  update: "Update",
  delete: "Delete",
  restore: "Restore",
  "permanent-delete": "Permanently delete",
  "deleted-list": "List deleted",
  deleted: "List deleted",
};

// Zod schema -> clean OpenAPI schema
const toSchema = (zodSchema) => {
  const json = z.toJSONSchema(zodSchema, {
    io: "input",
    unrepresentable: "any",
    target: "openapi-3.0",
  });
  const clean = (node) => {
    if (Array.isArray(node)) return node.map(clean);
    if (node && typeof node === "object") {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        if (k === "$schema") continue;
        if (k === "maximum" && v === Number.MAX_SAFE_INTEGER) continue; // noise from .int()
        out[k] = clean(v);
      }
      return out;
    }
    return node;
  };
  return clean(json);
};

const summaryOf = (method, subPath, tag) => {
  const first = subPath.split("/").filter(Boolean)[0] || "";
  const verb = VERBS[first] || `${method.toUpperCase()} /${first}`;
  return `${verb} (${tag})`;
};

const buildSpec = () => {
  const paths = {};

  for (const [mount, file] of MOUNTS) {
    const router = require(path.join(__dirname, "..", "routes", file));
    const tag = mount.replace("/api/", "");
    const isPublic = PUBLIC_MOUNTS.includes(mount);

    for (const layer of router.stack) {
      if (!layer.route) continue;
      const route = layer.route;
      const subPath = route.path;
      if (typeof subPath !== "string") continue;

      const oaPath = (mount + subPath).replace(/:([A-Za-z0-9_]+)/g, "{$1}");
      const handlers = route.stack.map((l) => l.handle);
      const roles = handlers.find((h) => h.roles)?.roles;
      const validators = handlers.filter((h) => h.schema);

      for (const method of Object.keys(route.methods)) {
        if (!route.methods[method] || method === "_all") continue;

        const parameters = [];
        for (const m of subPath.matchAll(/:([A-Za-z0-9_]+)/g)) {
          parameters.push({ name: m[1], in: "path", required: true, schema: { type: "string" } });
        }

        let requestBody;
        for (const v of validators) {
          if (v.source === "query") {
            const s = toSchema(v.schema);
            const required = s.required || [];
            for (const [name, prop] of Object.entries(s.properties || {})) {
              parameters.push({ name, in: "query", required: required.includes(name), schema: prop });
            }
          } else if (v.source === "body") {
            requestBody = {
              required: true,
              content: { "application/json": { schema: toSchema(v.schema) } },
            };
          }
        }

        const op = {
          tags: [tag],
          summary: summaryOf(method, subPath, tag),
          description: roles ? `Allowed roles: ${roles.join(", ")}` : undefined,
          security: isPublic ? [] : [{ bearerAuth: [] }],
          parameters,
          ...(requestBody && { requestBody }),
          responses: {
            200: { $ref: "#/components/responses/Success" },
            400: { $ref: "#/components/responses/BadRequest" },
            ...(!isPublic && { 401: { $ref: "#/components/responses/Unauthorized" } }),
            ...(roles && { 403: { $ref: "#/components/responses/Forbidden" } }),
            ...(subPath.includes(":") && { 404: { $ref: "#/components/responses/NotFound" } }),
          },
        };

        Object.assign(op, OVERRIDES[`${method.toUpperCase()} ${oaPath}`] || {});

        paths[oaPath] = paths[oaPath] || {};
        paths[oaPath][method] = op;
      }
    }
  }

  const errorBody = {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
        },
      },
    },
  };

  return {
    openapi: "3.0.3",
    info: {
      title: "School ERP API",
      version: "1.0.0",
      description:
        "Click **Authorize**, paste the `token` from `POST /api/auth/login`, then use *Try it out*. " +
        "Query filters go in the URL, not in a body. Dates for attendance are `YYYY-MM-DD`.",
    },
    servers: [{ url: "/" }],
    tags: MOUNTS.map(([mount]) => ({ name: mount.replace("/api/", "") })),
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      responses: {
        Success: {
          description: "Success. Body is { success: true, message, ...data }",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { success: { type: "boolean", example: true }, message: { type: "string" } },
              },
            },
          },
        },
        BadRequest: { description: "Validation failed or a business rule blocked the action", ...errorBody },
        Unauthorized: { description: "Missing/invalid token or account not allowed", ...errorBody },
        Forbidden: { description: "Role not permitted", ...errorBody },
        NotFound: { description: "Record not found", ...errorBody },
      },
    },
  };
};

// Docs are for development only: never exposed when NODE_ENV=production
const mountSwagger = (app) => {
  if (process.env.NODE_ENV === "production") return;

  try {
    const spec = buildSpec();
    app.get("/api-docs.json", (req, res) => res.json(spec));
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(spec, {
        customSiteTitle: "School ERP API Docs",
        swaggerOptions: { persistAuthorization: true, docExpansion: "none", filter: true },
      })
    );
    console.log("Swagger docs: /api-docs");
  } catch (err) {
    console.error("Swagger setup failed (server continues):", err.message);
  }
};

module.exports = { mountSwagger, buildSpec };