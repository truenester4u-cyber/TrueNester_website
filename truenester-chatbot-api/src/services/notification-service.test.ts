import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NotificationPayload } from "./notification-service";

global.fetch = vi.fn();

vi.mock("node-telegram-bot-api", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      sendMessage: vi.fn(),
    })),
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(),
    })),
  },
}));

describe("NotificationService", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("sendNotification", () => {
    it("should send Slack notification successfully when webhook is configured", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      process.env.FRONTEND_URL = "http://localhost:8080";

      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "ok",
      });

      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+971 50 123 4567",
        intent: "buy",
        source: "chatbot",
        leadScore: 85,
      };

      const result = await notificationService.sendNotification(payload);

      expect(result.success).toBe(true);
      expect(result.channels.slack?.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/test",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should fallback to Telegram when Slack fails", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      process.env.TELEGRAM_BOT_TOKEN = "test-token";
      process.env.TELEGRAM_CHAT_ID = "123456";
      process.env.FRONTEND_URL = "http://localhost:8080";

      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValueOnce(new Error("Slack network error"));

      const TelegramBot = (await import("node-telegram-bot-api")).default;
      const mockSendMessage = vi.fn().mockResolvedValue(true);
      (TelegramBot as any).mockImplementation(() => ({
        sendMessage: mockSendMessage,
      }));

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        source: "contact_form",
        subject: "Test Subject",
        message: "Test message",
      };

      const result = await notificationService.sendNotification(payload);

      expect(result.success).toBe(true);
      expect(result.channels.slack?.success).toBe(false);
      expect(result.channels.telegram?.success).toBe(true);
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it("should fallback to Email when both Slack and Telegram fail", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      process.env.TELEGRAM_BOT_TOKEN = "test-token";
      process.env.TELEGRAM_CHAT_ID = "123456";
      process.env.EMAIL_HOST = "smtp.gmail.com";
      process.env.EMAIL_USER = "test@example.com";
      process.env.EMAIL_PASS = "password";
      process.env.FRONTEND_URL = "http://localhost:8080";

      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValueOnce(new Error("Slack network error"));

      const TelegramBot = (await import("node-telegram-bot-api")).default;
      (TelegramBot as any).mockImplementation(() => ({
        sendMessage: vi.fn().mockRejectedValue(new Error("Telegram error")),
      }));

      const nodemailer = await import("nodemailer");
      const mockSendMail = vi.fn().mockResolvedValue(true);
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: mockSendMail,
      });

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Bob Smith",
        customerEmail: "bob@example.com",
        source: "property_inquiry",
        propertyTitle: "Luxury Villa",
        message: "I'm interested",
      };

      const result = await notificationService.sendNotification(payload);

      expect(result.success).toBe(true);
      expect(result.channels.slack?.success).toBe(false);
      expect(result.channels.telegram?.success).toBe(false);
      expect(result.channels.email?.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "info@truenester.com, truenester4u@gmail.com",
        })
      );
    });

    it("should return failure when all channels fail", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      process.env.TELEGRAM_BOT_TOKEN = "test-token";
      process.env.TELEGRAM_CHAT_ID = "123456";
      process.env.EMAIL_HOST = "smtp.gmail.com";
      process.env.EMAIL_USER = "test@example.com";
      process.env.EMAIL_PASS = "password";

      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValueOnce(new Error("Slack error"));

      const TelegramBot = (await import("node-telegram-bot-api")).default;
      (TelegramBot as any).mockImplementation(() => ({
        sendMessage: vi.fn().mockRejectedValue(new Error("Telegram error")),
      }));

      const nodemailer = await import("nodemailer");
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: vi.fn().mockRejectedValue(new Error("Email error")),
      });

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Test User",
        source: "chatbot",
      };

      const result = await notificationService.sendNotification(payload);

      expect(result.success).toBe(false);
      expect(result.channels.slack?.success).toBe(false);
      expect(result.channels.telegram?.success).toBe(false);
      expect(result.channels.email?.success).toBe(false);
    });
  });

  describe("Slack message formatting", () => {
    it("should format chatbot messages correctly", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      process.env.FRONTEND_URL = "http://localhost:8080";

      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "ok",
      });

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Test User",
        customerEmail: "test@example.com",
        customerPhone: "+971 50 123 4567",
        intent: "buy",
        budget: "AED 1.5M",
        propertyType: "Apartment",
        area: "Dubai Marina",
        leadScore: 75,
        duration: 10,
        source: "chatbot",
      };

      await notificationService.sendNotification(payload);

      const callArg = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArg.body);

      expect(body.blocks[0].text.text).toContain("Chatbot");
      expect(body.blocks[1].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: expect.stringContaining("Test User") }),
          expect.objectContaining({ text: expect.stringContaining("buy") }),
        ])
      );
    });

    it("should format contact form messages correctly", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";

      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "ok",
      });

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Contact User",
        customerEmail: "contact@example.com",
        department: "Sales",
        subject: "Test Subject",
        message: "Test message content",
        source: "contact_form",
      };

      await notificationService.sendNotification(payload);

      const callArg = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArg.body);

      expect(body.blocks[0].text.text).toContain("Contact Form");
      expect(body.blocks[2].text.text).toContain("Test Subject");
      expect(body.blocks[2].text.text).toContain("Test message content");
    });

    it("should format property inquiry messages correctly", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";

      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "ok",
      });

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Property User",
        customerEmail: "property@example.com",
        propertyTitle: "Luxury 2BR Apartment",
        propertyUrl: "http://localhost:8080/property/123",
        message: "Interested in viewing",
        source: "property_inquiry",
      };

      await notificationService.sendNotification(payload);

      const callArg = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArg.body);

      expect(body.blocks[0].text.text).toContain("Property Inquiry");
      expect(body.blocks[1].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: expect.stringContaining("Luxury 2BR Apartment") }),
        ])
      );
      expect(body.blocks[3].elements).toHaveLength(2);
    });
  });

  describe("Telegram message formatting", () => {
    it("should format Telegram messages with HTML", async () => {
      process.env.SLACK_WEBHOOK_URL = undefined;
      process.env.TELEGRAM_BOT_TOKEN = "test-token";
      process.env.TELEGRAM_CHAT_ID = "123456";

      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValueOnce(new Error("No Slack"));

      const TelegramBot = (await import("node-telegram-bot-api")).default;
      const mockSendMessage = vi.fn().mockResolvedValue(true);
      (TelegramBot as any).mockImplementation(() => ({
        sendMessage: mockSendMessage,
      }));

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Telegram User",
        source: "chatbot",
        leadScore: 90,
      };

      await notificationService.sendNotification(payload);

      expect(mockSendMessage).toHaveBeenCalledWith(
        "123456",
        expect.stringContaining("<b>New Chatbot Conversation</b>"),
        expect.objectContaining({ parse_mode: "HTML" })
      );
    });
  });

  describe("Email message formatting", () => {
    it("should send HTML and plain text email", async () => {
      process.env.SLACK_WEBHOOK_URL = undefined;
      process.env.TELEGRAM_BOT_TOKEN = undefined;
      process.env.EMAIL_HOST = "smtp.gmail.com";
      process.env.EMAIL_USER = "test@example.com";
      process.env.EMAIL_PASS = "password";

      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValueOnce(new Error("No Slack"));

      const nodemailer = await import("nodemailer");
      const mockSendMail = vi.fn().mockResolvedValue(true);
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: mockSendMail,
      });

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Email User",
        customerEmail: "email@example.com",
        source: "contact_form",
        subject: "Test",
        message: "Test message",
      };

      await notificationService.sendNotification(payload);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("<h2>"),
          text: expect.stringContaining("Email User"),
          subject: expect.stringContaining("Test"),
        })
      );
    });

    it("should send to both configured email addresses", async () => {
      process.env.SLACK_WEBHOOK_URL = undefined;
      process.env.TELEGRAM_BOT_TOKEN = undefined;
      process.env.EMAIL_HOST = "smtp.gmail.com";
      process.env.EMAIL_USER = "test@example.com";
      process.env.EMAIL_PASS = "password";

      const nodemailer = await import("nodemailer");
      const mockSendMail = vi.fn().mockResolvedValue(true);
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: mockSendMail,
      });

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Test",
        source: "chatbot",
      };

      await notificationService.sendNotification(payload);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "info@truenester.com, truenester4u@gmail.com",
        })
      );
    });
  });

  describe("Configuration validation", () => {
    it("should skip Slack when not configured", async () => {
      process.env.SLACK_WEBHOOK_URL = undefined;
      process.env.TELEGRAM_BOT_TOKEN = "test-token";
      process.env.TELEGRAM_CHAT_ID = "123456";

      const mockFetch = global.fetch as any;
      mockFetch.mockClear();

      const TelegramBot = (await import("node-telegram-bot-api")).default;
      const mockSendMessage = vi.fn().mockResolvedValue(true);
      (TelegramBot as any).mockImplementation(() => ({
        sendMessage: mockSendMessage,
      }));

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Test",
        source: "chatbot",
      };

      const result = await notificationService.sendNotification(payload);

      expect(result.channels.slack?.success).toBe(false);
      expect(result.channels.telegram?.success).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should skip Telegram when not configured", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      process.env.TELEGRAM_BOT_TOKEN = undefined;

      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValueOnce(new Error("Slack error"));

      delete require.cache[require.resolve("./notification-service")];
      const { notificationService } = await import("./notification-service");

      const payload: NotificationPayload = {
        customerName: "Test",
        source: "chatbot",
      };

      const result = await notificationService.sendNotification(payload);

      expect(result.channels.telegram?.success).toBe(false);
      expect(result.channels.telegram?.error).toContain("not configured");
    });
  });
});
