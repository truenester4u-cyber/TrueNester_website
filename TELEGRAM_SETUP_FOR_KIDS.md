# 🤖 Telegram Notifications - Super Simple Guide

**Good News!** 🎉 Your backend already has Telegram support built-in! You just need to turn it on.

---

## 📱 **Step 1: Talk to BotFather (Telegram's Robot Boss)**

Think of BotFather as the person who creates all Telegram bots. We need to ask him to make a bot for us.

1. **Open Telegram** on your phone or computer
2. **Search for:** `@BotFather` (yes, that's his real name!)
3. **Click** on him and press **"START"**
4. **Type:** `/newbot` and press Enter

BotFather will ask you questions:

### Question 1: What's your bot's name?
**Type something like:**
```
True Nester Notifications
```
(This is just a friendly name, you can type anything)

### Question 2: What's your bot's username?
**Type something like:**
```
TrueNesterBot
```
⚠️ **Important:** Must end with "bot" or "Bot"
⚠️ Must be unique (if someone already used it, try another name)

---

## 🎁 **Step 2: Get Your Secret Code**

After you answer BotFather's questions, he will give you a **special secret code**. It looks like this:

```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

**COPY THIS CODE!** 📋 We need it later.

---

## 💬 **Step 3: Start Chatting with Your Bot**

1. **Search for** your bot's username (the one you just created)
   - Example: Search for `@TrueNesterBot`
2. **Click** on your bot
3. **Press "START"** button or type `/start`
4. **Send a message** to your bot (type anything like "Hello!")

**Why?** Because your bot needs to know who you are before it can send messages.

---

## 🔢 **Step 4: Get Your Chat ID (Your Phone Number for Bot)**

This is like getting your phone number so the bot knows where to send messages.

### Method 1: Using a Website (Easiest)
1. **Go to this website:**
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   
2. **Replace** `<YOUR_BOT_TOKEN>` with the secret code from Step 2
   
   **Example:** If your code is `1234567890:ABCdefGHI`, the URL becomes:
   ```
   https://api.telegram.org/bot1234567890:ABCdefGHI/getUpdates
   ```

3. **Press Enter**

4. **Look for** the number next to `"chat":{"id":` 
   
   It looks like: `"id": 123456789`
   
   **COPY THIS NUMBER!** 📋 This is your Chat ID.

### Method 2: Using Another Bot (Alternative)
1. **Search for:** `@userinfobot` in Telegram
2. **Press START**
3. It will show your **Chat ID** immediately

---

## ⚙️ **Step 5: Add Your Secret Codes to Backend**

Now we tell your backend the secret codes.

1. **Open this file:**
   ```
   truenester-chatbot-api/.env
   ```

2. **Add these 2 lines at the bottom:**
   ```env
   TELEGRAM_BOT_TOKEN=YOUR_SECRET_CODE_FROM_STEP_2
   TELEGRAM_CHAT_ID=YOUR_CHAT_ID_FROM_STEP_4
   ```

3. **Replace the text** with your actual codes:
   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
   TELEGRAM_CHAT_ID=123456789
   ```

4. **Save the file** (Ctrl+S or Cmd+S)

---

## 🚀 **Step 6: Restart Your Backend**

Your backend needs to restart to read the new codes.

1. **Stop your backend** (if it's running)
   - Press `Ctrl+C` in the terminal where it's running

2. **Start it again:**
   ```bash
   cd truenester-chatbot-api
   npm run dev
   ```

3. **Look for this message** in the console:
   ```
   [TELEGRAM] Telegram bot initialized
   ```
   
   ✅ If you see this = SUCCESS!
   ❌ If you don't see this = Something went wrong

---

## 🧪 **Step 7: Test It!**

Now let's see if Telegram works!

1. **Go to your website** (http://localhost:8080)
2. **Fill out the Contact Form**
3. **Submit it**
4. **Check your Telegram** 📱

You should receive a message from your bot with the form details!

---

## 🎯 **How to Know It's Working?**

When someone submits a form, you should see:

✅ **In Backend Console:**
```
[NOTIFICATION] Sending to all channels: Slack, Telegram, and Email
[TELEGRAM] ✅ Telegram notification sent
[EMAIL] ✅ Email sent successfully!
[NOTIFICATION] ✅ Sent via: Slack, Telegram, Email
```

✅ **In Your Telegram:**
You'll get a message like:
```
📬 NEW CONTACT FORM

👤 Name: John Doe
📧 Email: john@example.com
📱 Phone: +971 50 123 4567
🏢 Department: Sales

📝 Subject: Interested in property
Message: I want to buy an apartment...
```

---

## 🎁 **BONUS: Group Chat Notifications**

Want notifications in a **group chat** instead of your personal chat?

1. **Create a group** in Telegram
2. **Add your bot** to the group
3. **Make your bot an admin** (Settings → Edit → Administrators → Add Admin)
4. **Send a message** in the group: `/start@YourBotUsername`
5. **Get the group's Chat ID** using the same method as Step 4
   - Group IDs start with a minus sign: `-123456789`
6. **Update** `.env` with the group Chat ID:
   ```env
   TELEGRAM_CHAT_ID=-123456789
   ```
7. **Restart backend**

Now everyone in the group will see notifications! 🎉

---

## 🆘 **Troubleshooting (If Something Goes Wrong)**

### Problem: "Telegram bot not initialized" in console
**Solution:** Check if both codes are in `.env` file and restart backend

### Problem: No messages in Telegram
**Solution:** 
1. Did you press START in your bot? (Step 3)
2. Is your Chat ID correct? (Step 4)
3. Check backend console for errors

### Problem: "Bot was blocked by the user"
**Solution:** Unblock your bot in Telegram and press START again

### Problem: Backend shows error "Invalid token"
**Solution:** Copy the bot token again from BotFather (maybe you copied it wrong)

---

## 📋 **Quick Checklist**

- [ ] Created bot with @BotFather
- [ ] Got bot token (looks like: `123:ABC123`)
- [ ] Started chat with my bot
- [ ] Got Chat ID (looks like: `123456789`)
- [ ] Added both to `.env` file
- [ ] Restarted backend
- [ ] Saw "Telegram bot initialized" in console
- [ ] Tested by submitting a form
- [ ] Received message in Telegram

---

## 🎉 **YOU'RE DONE!**

Now every time someone:
- 📝 Fills contact form
- 🏠 Inquires about property
- 💰 Submits sell/valuation request
- 💬 Chats with the bot

You'll get notifications in:
1. 📱 **Telegram** ← NEW!
2. 📧 **Email**
3. 💬 **Slack**

All at the same time! 🎊

---

## 🚀 **For Production (Live Website)**

When you deploy your website, add these to your hosting:

**On Render/Railway/Heroku:**
- Go to Environment Variables
- Add: `TELEGRAM_BOT_TOKEN` = (your token)
- Add: `TELEGRAM_CHAT_ID` = (your chat id)
- Redeploy

Done! 🎉
