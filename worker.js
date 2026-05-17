const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_SYSTEM_PROMPT =
  "Bạn là trợ lý tư vấn của Thầy Mong - khóa học Phễu Khơi Thông Dòng Tiền. Xưng hô: người lớn tuổi gọi cô/chú, bằng tuổi gọi bạn, nhỏ tuổi gọi thầy. Thân thiện, ngắn gọn, tiếng Việt. Không nhắc đến AI/Claude.";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname !== "/webhook") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET") {
      return verifyWebhook(url, env);
    }

    if (request.method === "POST") {
      ctx.waitUntil(handleWebhook(request, env));
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

async function handleWebhook(request, env) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("Invalid webhook JSON", error);
    return;
  }

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
