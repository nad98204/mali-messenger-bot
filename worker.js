const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_HISTORY_MESSAGES = 6;
const SUMMARY_TRIGGER_MESSAGES = 6;
const CLAUDE_SYSTEM_PROMPT = `Bạn là Thầy Mong, đang nhắn trực tiếp với học viên tiềm năng qua Messenger. Không nói mình là bot, trợ lý hay AI.

Xưng hô: luôn xưng "tớ" hoặc "thầy" tùy người đối diện; gọi khách là b, bạn, anh, chị hoặc em theo ngữ cảnh. Không tự xưng "e/em".

Phong cách: nhắn như người thật, cực ngắn, tự nhiên, thân thiện. Mỗi tin chỉ 1 câu ngắn, tối đa 10-15 từ. Dùng [NEXT] để tách nhiều tin, mỗi tin 1 ý. Không emoji, không bullet, không in đậm, không hỏi nhiều câu cùng lúc.

Kịch bản: khách chào thì chào lại và hỏi 1 câu tìm hiểu. Khách chia sẻ vấn đề thì đồng cảm ngắn rồi hỏi thêm 1 câu. Khi khách thật sự bế tắc về nợ, tài chính, kinh doanh thì có thể kể rất ngắn chuyện thầy từng trải qua, rồi mới nhắc khóa học. Khách hỏi đăng ký khóa miễn phí thì gửi link ngay: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien/?utm_source=dang&utm_term=ktdt&utm_content=fpmongcoaching. Cần tư vấn sâu hơn thì nói: "b nhắn trợ lý tớ nha, sdt 0355 067 656".

Khi khách nhắn từ khóa chứa 'nhanqua', 'nhận quà', 'qua': gửi ngay link quà tặng rồi hỏi 1 câu về vấn đề tài chính. Sau khi khách chia sẻ vấn đề bất kỳ: đồng cảm 1 câu ngắn rồi gửi link đăng ký khóa học ngay, không dẫn dắt dài.

Ví dụ đúng:
Khách: "mình đang bế tắc tài chính quá"
Thầy: "ừ tớ hiểu cảm giác đó lắm[NEXT]b đang gặp kiểu thu nhập không đủ hay kinh doanh bế tắc?"

Thông tin khóa học: Khơi Thông Dòng Tiền, 4 buổi tối online miễn phí, 500+ người đăng ký.
Khóa chuyên sâu: Luật Hấp Dẫn Online - Chuyên Sâu, 12 buổi online qua Zoom, có video xem lại, nhóm học tập, bài tập, thiền dẫn, coaching và Leader hỗ trợ.
Tư vấn khóa học: khách mới tìm hiểu, chưa tin, chưa sẵn sàng hoặc chưa có tiền thì mời khóa miễn phí. Khách đã rõ vấn đề, đang nợ, kinh doanh bế tắc, thu nhập thấp lâu năm, trì hoãn, muốn chữa lành tài chính hoặc cần lộ trình bài bản thì gợi ý khóa chuyên sâu.
Học phí khóa chuyên sâu: không báo giá sớm. Chỉ khi khách cảm xúc lên cao và muốn học thì xin số điện thoại để tư vấn hoặc chuyển admin/trợ lý chốt. Không hứa chắc chắn giàu, hết nợ, tăng thu nhập, khách tự tìm đến, hoặc đổi đời.

Không được bịa đặt hoặc suy đoán thông tin về Thầy Mong. Chỉ được dùng đúng những thông tin này về thầy Mong: hơn chục năm trước bị lừa mất hết tiền tích lũy, vướng nợ, bị đuổi việc, thất nghiệp. Thay đổi nhờ hiểu đúng Luật Hấp Dẫn và Nhân Quả — 3 rào cản: tần số rung động thấp, niềm tin tài chính sai lệch, hiểu sai Nhân Quả. Hiện tại tài chính vững vàng, đã giúp 10.000+ học viên. Nếu thiếu thông tin thì nói "cái này bạn có thể xem thêm tại đây nhé" rồi gửi link landing page, hoặc hỏi thêm về vấn đề của khách.`;

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

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runRemarketing(env));
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
      if (event.message?.is_echo || !event.sender?.id) {
        continue;
      }

      if (event.message?.text) {
        tasks.push(handleMessage(event.sender.id, event.message.text, env));
      } else if (event.optin) {
        tasks.push(handleMessage(event.sender.id, "xin chào", env));
      } else if (event.postback) {
        tasks.push(
          handleMessage(
            event.sender.id,
            event.postback.title || event.postback.payload,
            env,
          ),
        );
      }
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

    if (messages.length >= SUMMARY_TRIGGER_MESSAGES) {
      messages = await summarizeMessages(messages, env);
    }

    messages = messages.slice(-MAX_HISTORY_MESSAGES);
    const answer = await askClaude(messages, env, userText);

    messages.push({
      role: "assistant",
      content: answer,
    });
    messages = messages.slice(-MAX_HISTORY_MESSAGES);

    const updatedState = {
      messages,
      lastSeen: new Date().toISOString(),
      status: getUpdatedStatus(userText, chatState.status),
      firstMessage: chatState.firstMessage || userText,
    };

    await env.CHAT_HISTORY.put(senderId, JSON.stringify(updatedState), {
      expirationTtl: 2592000,
    });

    await sendMessengerParts(senderId, answer, env);
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
    .slice(-MAX_HISTORY_MESSAGES);
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
  return (
    status === "new" ||
    status === "interested" ||
    status === "registered" ||
    status === "remarketed"
  );
}

async function runRemarketing(env) {
  let cursor;
  const now = new Date();

  do {
    const keys = await env.CHAT_HISTORY.list({ cursor });

    for (const key of keys.keys) {
      const raw = await env.CHAT_HISTORY.get(key.name);
      if (!raw) {
        continue;
      }

      let data;

      try {
        data = JSON.parse(raw);
      } catch (error) {
        console.error("Invalid remarketing JSON", error);
        continue;
      }

      if (!data.lastSeen || !data.status || data.status === "registered") {
        continue;
      }

      const lastSeen = new Date(data.lastSeen);
      const hoursAgo = (now - lastSeen) / (1000 * 60 * 60);

      if (hoursAgo >= 20 && hoursAgo < 21) {
        const senderId = key.name;
        const message =
          data.status === "interested"
            ? "Hôm qua bạn có hỏi về khóa học Khơi Thông Dòng Tiền, bạn đăng ký chưa nhỉ? Link đây nếu cần: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien/?utm_source=dang&utm_term=ktdt&utm_content=fpmongcoaching"
            : "Hôm qua mình có nói chuyện, bạn có muốn tìm hiểu thêm về khóa Khơi Thông Dòng Tiền không? Khóa miễn phí đó bạn ơi";

        await sendMessengerText(senderId, message, env);

        data.status = "remarketed";
        await env.CHAT_HISTORY.put(key.name, JSON.stringify(data), {
          expirationTtl: 2592000,
        });
      }
    }

    cursor = keys.list_complete ? undefined : keys.cursor;
  } while (cursor);
}

async function askClaude(messages, env, userText) {
  const ragContext = await retrieveRagContext(userText, env);
  const systemText = ragContext
    ? `${CLAUDE_SYSTEM_PROMPT}\n\nNỘI DUNG LIÊN QUAN TỪ KHÓA HỌC:\n${ragContext}`
    : CLAUDE_SYSTEM_PROMPT;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: [
        {
          type: "text",
          text: systemText,
          cache_control: { type: "ephemeral" },
        },
      ],
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

async function retrieveRagContext(userText, env) {
  try {
    const queryEmbedding = await env.AI.run("@cf/baai/bge-m3", { text: [userText] });
    const queryVector = queryEmbedding.data?.[0];

    if (!Array.isArray(queryVector)) {
      return null;
    }

    const results = await env.RAG_INDEX.query(queryVector, {
      topK: 2,
      returnMetadata: "all",
    });

    const chunks = (results.matches || [])
      .filter((match) => match.score >= 0.5)
      .map((match) => match.metadata?.text)
      .filter((text) => typeof text === "string" && text.trim());

    return chunks.length > 0 ? chunks.join("\n\n") : null;
  } catch (error) {
    console.error("RAG retrieval error", error);
    return null;
  }
}

async function summarizeMessages(messages, env) {
  const lastMessages = messages.slice(-2);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 120,
      system:
        "Tóm tắt cuộc trò chuyện này trong 1-2 câu ngắn bằng tiếng Việt, chỉ giữ thông tin quan trọng về vấn đề của khách",
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude summary error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const summary = Array.isArray(data.content)
    ? data.content
        .filter((block) => block.type === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("\n")
        .trim()
    : "";

  if (!summary) {
    return messages;
  }

  return [
    {
      role: "user",
      content: `[TÓM TẮT CUỘC HỘI THOẠI TRƯỚC: ${summary}]`,
    },
    ...lastMessages,
  ];
}

async function sendMessengerParts(recipientId, text, env) {
  const parts = text
    .split("[NEXT]")
    .map((part) => part.trim())
    .filter(Boolean);

  for (let index = 0; index < parts.length; index += 1) {
    if (index > 0) {
      await delay(3000);
    }

    await sendMessengerText(recipientId, parts[index], env);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
