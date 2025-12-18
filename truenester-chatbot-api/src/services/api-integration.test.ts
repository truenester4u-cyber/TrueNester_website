import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { notificationService } from "./notification-service";

vi.mock("./notification-service");

describe("API Integration Tests", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.post("/api/notifications/fallback", async (req, res) => {
      try {
        const payload = req.body;
        const result = await notificationService.sendNotification(payload);

        if (result.success) {
          const channels = Object.entries(result.channels)
            .filter(([_, v]) => v?.success)
            .map(([k]) => k);
          res.json({ success: true, channels });
        } else {
          res.status(500).json({ success: false, error: "All notification channels failed" });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    app.get("/health", (_req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        slackConfigured: !!process.env.SLACK_WEBHOOK_URL,
        telegramConfigured: !!(
          process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
        ),
        emailConfigured: !!(
          process.env.EMAIL_HOST &&
          process.env.EMAIL_USER &&
          process.env.EMAIL_PASS
        ),
        port: 4000,
      });
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/notifications/fallback", () => {
    it("should accept valid notification payload", async () => {
      (notificationService.sendNotification as any).mockResolvedValue({
        success: true,
        channels: {
          slack: { success: true },
        },
      });

      const response = await request(app)
        .post("/api/notifications/fallback")
        .send({
          customerName: "Test User",
          customerEmail: "test@example.com",
          source: "contact_form",
          subject: "Test Subject",
          message: "Test message",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.channels).toContain("slack");
    });

    it("should handle chatbot notification payload", async () => {
      (notificationService.sendNotification as any).mockResolvedValue({
        success: true,
        channels: {
          telegram: { success: true },
        },
      });

      const response = await request(app)
        .post("/api/notifications/fallback")
        .send({
          customerName: "Chatbot User",
          customerEmail: "chatbot@example.com",
          customerPhone: "+971 50 123 4567",
          intent: "buy",
          budget: "AED 1.5M",
          propertyType: "Apartment",
          area: "Dubai Marina",
          leadScore: 85,
          duration: 10,
          source: "chatbot",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.channels).toContain("telegram");
    });

    it("should handle property inquiry notification payload", async () => {
      (notificationService.sendNotification as any).mockResolvedValue({
        success: true,
        channels: {
          email: { success: true },
        },
      });

      const response = await request(app)
        .post("/api/notifications/fallback")
        .send({
          customerName: "Property User",
          customerEmail: "property@example.com",
          propertyTitle: "Luxury 2BR Apartment",
          propertyUrl: "http://localhost:8080/property/123",
          message: "Interested in viewing",
          source: "property_inquiry",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.channels).toContain("email");
    });

    it("should return 500 when all notification channels fail", async () => {
      (notificationService.sendNotification as any).mockResolvedValue({
        success: false,
        channels: {
          slack: { success: false, error: "Failed" },
          telegram: { success: false, error: "Failed" },
          email: { success: false, error: "Failed" },
        },
      });

      const response = await request(app)
        .post("/api/notifications/fallback")
        .send({
          customerName: "Test User",
          source: "contact_form",
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("All notification channels failed");
    });

    it("should handle notification service errors gracefully", async () => {
      (notificationService.sendNotification as any).mockRejectedValue(
        new Error("Service unavailable")
      );

      const response = await request(app)
        .post("/api/notifications/fallback")
        .send({
          customerName: "Test User",
          source: "contact_form",
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Service unavailable");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: "ok",
        timestamp: expect.any(String),
        slackConfigured: expect.any(Boolean),
        telegramConfigured: expect.any(Boolean),
        emailConfigured: expect.any(Boolean),
        port: 4000,
      });
    });

    it("should return valid ISO timestamp", async () => {
      const response = await request(app).get("/health").expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe("Notification Payload Validation", () => {
    it("should handle minimal contact form payload", async () => {
      (notificationService.sendNotification as any).mockResolvedValue({
        success: true,
        channels: { slack: { success: true } },
      });

      await request(app)
        .post("/api/notifications/fallback")
        .send({
          customerName: "John Doe",
          source: "contact_form",
        })
        .expect(200);

      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: "John Doe",
          source: "contact_form",
        })
      );
    });

    it("should preserve all payload fields", async () => {
      (notificationService.sendNotification as any).mockResolvedValue({
        success: true,
        channels: { slack: { success: true } },
      });

      const payload = {
        customerName: "Jane Smith",
        customerEmail: "jane@example.com",
        customerPhone: "+971 50 123 4567",
        source: "property_inquiry" as const,
        propertyTitle: "Luxury Villa",
        propertyUrl: "http://localhost:8080/property/456",
        message: "Interested in this property",
      };

      await request(app)
        .post("/api/notifications/fallback")
        .send(payload)
        .expect(200);

      expect(notificationService.sendNotification).toHaveBeenCalledWith(payload);
    });
  });
});
