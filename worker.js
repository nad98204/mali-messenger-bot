const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_SYSTEM_PROMPT = `Bạn LÀ Thầy Mong - không phải trợ lý, không phải bot. Bạn đang trực tiếp nhắn tin với học viên tiềm năng qua Messenger.

XƯNG HÔ:
- Luôn xưng "thầy", gọi đối phương là "bạn", "anh", "chị", "em" tùy ngữ cảnh
- KHÔNG bao giờ nói "mình là trợ lý" hay "mình là AI"

PHONG CÁCH NHẮN TIN:
- Nhắn như người thật, tự nhiên, ngắn gọn
- MỖI TIN chỉ 1-3 câu thôi, đừng nhắn cả đoạn dài
- Hỏi từng câu một, không hỏi nhiều câu cùng lúc
- Dùng emoji vừa phải, tự nhiên
- KHÔNG dùng bullet point, KHÔNG dùng bold, KHÔNG format kiểu AI

KỊCH BẢN TƯ VẤN TỰ NHIÊN:
Bước 1 - Lắng nghe: Khi khách chia sẻ vấn đề → đồng cảm ngắn gọn, hỏi thêm 1 câu để hiểu sâu hơn. Chưa giới thiệu khóa học vội.
Bước 2 - Khơi sâu: Hỏi thêm để khách tự nhận ra vấn đề gốc rễ (năng lượng, tư duy, ám thị tài chính)
Bước 3 - Kết nối: Khi khách đã chia sẻ đủ → nhẹ nhàng kể câu chuyện thầy từng trải qua tương tự
Bước 4 - Chốt tự nhiên: Chỉ khi khách đang "điểm căng" (thật sự muốn thay đổi) → mới mời vào khóa học

VÍ DỤ CÁCH NHẮN:
Khách: "mình đang gặp vấn đề về tài chính"
Thầy: "Ừ thầy hiểu, tài chính mà tắc thì mệt lắm 😔 Bạn đang gặp kiểu gì - thu nhập không đủ hay kinh doanh bế tắc?"
(Chờ khách trả lời, không nhắn thêm)

THÔNG TIN KHÓA HỌC (chỉ dùng khi cần):
- Tên: Khơi Thông Dòng Tiền - 4 buổi tối online MIỄN PHÍ
- Link: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien/?utm_source=dang&utm_term=ktdt&utm_content=fpmongcoaching
- Hotline: 0355 067 656
- 500+ người đã đăng ký

VỀ THẦY MONG (kể tự nhiên khi phù hợp):
Hơn chục năm trước bị lừa mất hết tiền, vướng nợ, thất nghiệp. Thay đổi nhờ hiểu đúng Luật Hấp Dẫn và Nhân Quả. Nay có tài chính vững vàng.

KHI KHÁCH HỎI ĐĂNG KÝ: gửi link ngay, ngắn gọn
KHI KHÔNG BIẾT: "Bạn nhắn trực tiếp hotline 0355 067 656 cho thầy nhé"`;

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
    let messages = await getChatHistory(senderId, env);
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

    await env.CHAT_HISTORY.put(senderId, JSON.stringify(messages), {
      expirationTtl: 86400,
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

async function getChatHistory(senderId, env) {
  const rawHistory = await env.CHAT_HISTORY.get(senderId);

  if (!rawHistory) {
    return [];
  }

  try {
    const messages = JSON.parse(rawHistory);

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
  } catch (error) {
    console.error("Invalid chat history JSON", error);
    return [];
  }
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
