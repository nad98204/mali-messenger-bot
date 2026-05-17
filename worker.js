import { RAG_DATA } from "./rag-data.js";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_SYSTEM_PROMPT = `Mày là Thầy Mong - đang nhắn tin trực tiếp với học viên qua Messenger. Không phải bot, không phải trợ lý.

PHONG CÁCH (quan trọng nhất):
- Nhắn cực ngắn, tự nhiên như người thật
- Dùng: "e", "b", "c", "tớ", "nhé", "nha", "ạ", "hi", "oki"
- Mỗi tin 1-2 câu thôi
- Không dùng emoji, không dùng bullet, không format
- Hỏi từng câu một, không hỏi nhiều cùng lúc

KỊCH BẢN:
1. Khách chào/hỏi thăm → chào lại tự nhiên, hỏi 1 câu tìm hiểu
2. Khách chia sẻ vấn đề → đồng cảm ngắn, hỏi thêm 1 câu
3. Khách đang "điểm căng" (nợ, bế tắc, tuyệt vọng) → kể ngắn câu chuyện thầy từng trải qua tương tự, rồi mới nhắc khóa học
4. Khách hỏi đăng ký/khóa học → gửi link ngay: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien/?utm_source=dang&utm_term=ktdt&utm_content=fpmongcoaching
5. Cần tư vấn sâu hơn → "e nhắn trợ lý tớ nha, sdt 0355 067 656"

VÍ DỤ ĐÚNG:
Khách: "mình đang bế tắc tài chính quá"
Thầy: "ừ tớ hiểu cảm giác đó lắm, bạn đang gặp kiểu gì - thu nhập không đủ hay kinh doanh bế tắc?"

Khách: "kinh doanh bế tắc, bán mãi không ra đơn"
Thầy: "bán ngành gì vậy b"

VÍ DỤ SAI (không được làm):
- Nhắn cả đoạn dài
- Dùng bullet point, số thứ tự, in đậm
- Hỏi nhiều câu cùng lúc

THÔNG TIN KHÓA HỌC (chỉ khi cần):
Khơi Thông Dòng Tiền - 4 buổi tối online MIEN PHI - 500+ người đăng ký
Link: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien/?utm_source=dang&utm_term=ktdt&utm_content=fpmongcoaching

VE THAY MONG (ke tu nhien khi phu hop):
Hon chuc nam truoc bi lua mat het tien, no nan, that nghiep. Thay doi nho Luat Hap Dan va Nhan Qua.

NỘI DUNG KHÓA HỌC (dùng khi khách hỏi về nội dung học):
${RAG_DATA.buoi1}

${RAG_DATA.buoi2}`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname !== "/webhook" && url.pathname !== "/") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET") {
      return verifyWebhook(url, env);
    }

    if (request.method === "POST") {
      let payload;

      try {
        payload = await request.clone().json();
      } catch (error) {
        console.error("Invalid webhook JSON", error);
        return new Response("OK", { status: 200 });
      }

      ctx.waitUntil(handleWebhook(payload, env));
      return new Response("OK", { status: 200 });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, POST" },
    });
  },
};

function verifyWebhook(url, env) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

async function handleWebhook(payload, env) {
  if (payload.object !== "page" || !Array.isArray(payload.entry)) {
    return;
  }

  const tasks = [];

  for (const entry of payload.entry) {
    const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];

    for (const event of messagingEvents) {
      if (event.message?.is_echo || !event.sender?.id || !event.message?.text) {
        continue;
      }

      tasks.push(handleMessage(event.sender.id, event.message.text, env));
    }
  }

  await Promise.allSettled(tasks);
}

async function handleMessage(senderId, userText, env) {
  try {
    const chatState = await getChatState(senderId, env);
    let messages = chatState.messages;
    const isFirstMessage = messages.length === 0;

    if (isFirstMessage) {
      await saveToSheet(senderId, userText);
    }

    messages.push({
      role: "user",
      content: userText,
    });

    messages = messages.slice(-20);
    const answer = await askClaude(messages, env);

    messages.push({
      role: "assistant",
      content: answer,
    });
    messages = messages.slice(-20);

    const updatedState = {
      messages,
      lastSeen: new Date().toISOString(),
      status: getUpdatedStatus(userText, chatState.status),
      firstMessage: chatState.firstMessage || userText,
    };

    await env.CHAT_HISTORY.put(senderId, JSON.stringify(updatedState), {
      expirationTtl: 2592000,
    });

    await sendMessengerText(senderId, answer, env);
  } catch (error) {
    console.error("Failed to reply message", error);
    await sendMessengerText(
      senderId,
      "Hiện tại thầy chưa phản hồi được ngay. Cô/chú/bạn vui lòng nhắn lại sau ít phút nhé.",
      env,
    );
  }
}

function getUpdatedStatus(userText, currentStatus) {
  const normalizedText = userText.toLowerCase();

  if (
    normalizedText.includes("đã đăng ký") ||
    normalizedText.includes("đăng ký rồi") ||
    normalizedText.includes("xong rồi")
  ) {
    return "registered";
  }

  if (
    normalizedText.includes("đăng ký") ||
    normalizedText.includes("link") ||
    normalizedText.includes("tham gia") ||
    normalizedText.includes("vé")
  ) {
    return "interested";
  }

  return currentStatus;
}

async function saveToSheet(senderId, firstMessage) {
  try {
    await fetch(
      "https://script.google.com/macros/s/AKfycbxT6ubzHH46HjmqxvfPY_RuoSiHpnNCGaSUOp6SSAud7BDZpQec_Wy5QwZI4w5Y9ouB/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
          facebook_id: senderId,
          first_message: firstMessage,
          status: "Mới",
        }),
      },
    );
  } catch (err) {
    console.error("Sheet error:", err);
  }
}

async function getChatState(senderId, env) {
  const rawHistory = await env.CHAT_HISTORY.get(senderId);

  if (!rawHistory) {
    return {
      messages: [],
      lastSeen: null,
      status: "new",
      firstMessage: "",
    };
  }

  try {
    const data = JSON.parse(rawHistory);

    if (Array.isArray(data)) {
      return {
        messages: sanitizeMessages(data),
        lastSeen: null,
        status: "new",
        firstMessage: getFirstUserMessage(data),
      };
    }

    if (data && typeof data === "object") {
      return {
        messages: sanitizeMessages(data.messages),
        lastSeen: typeof data.lastSeen === "string" ? data.lastSeen : null,
        status: isValidStatus(data.status) ? data.status : "new",
        firstMessage:
          typeof data.firstMessage === "string"
            ? data.firstMessage
            : getFirstUserMessage(data.messages),
      };
    }

    return {
      messages: [],
      lastSeen: null,
      status: "new",
      firstMessage: "",
    };
  } catch (error) {
    console.error("Invalid chat history JSON", error);
    return {
      messages: [],
      lastSeen: null,
      status: "new",
      firstMessage: "",
    };
  }
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
    .slice(-20);
}

function getFirstUserMessage(messages) {
  if (!Array.isArray(messages)) {
    return "";
  }

  const firstUserMessage = messages.find(
    (message) => message.role === "user" && typeof message.content === "string",
  );

  return firstUserMessage?.content || "";
}

function isValidStatus(status) {
  return status === "new" || status === "interested" || status === "registered";
}

async function askClaude(messages, env) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: CLAUDE_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = Array.isArray(data.content)
    ? data.content
        .filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("\n")
        .trim()
    : "";

  return text || "Thầy đã nhận được tin nhắn và sẽ phản hồi cô/chú/bạn sớm nhé.";
}

async function sendMessengerText(recipientId, text, env) {
  const response = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(
      env.PAGE_ACCESS_TOKEN,
    )}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: { text: text.slice(0, 2000) },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Messenger API error: ${response.status} ${await response.text()}`);
  }
}
