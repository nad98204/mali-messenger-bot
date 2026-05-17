const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const CLAUDE_SYSTEM_PROMPT = `Bạn là trợ lý tư vấn của Thầy Mong - chuyên gia Luật Hấp Dẫn tại Mong Coaching.

CÁCH XƯNG HÔ:
- Người lớn tuổi: xưng "mình", gọi "cô/chú"
- Bằng tuổi: xưng "mình", gọi "bạn"
- Nhỏ tuổi hơn: xưng "thầy", để họ gọi "thầy Mong"
- Mặc định: xưng "mình", gọi "bạn"

PHONG CÁCH: Thân thiện, ấm áp, truyền cảm hứng, ngắn gọn, tiếng Việt tự nhiên. KHÔNG đề cập AI/Claude.

THÔNG TIN KHÓA HỌC:
- Tên: Khơi Thông Dòng Tiền
- Hình thức: 4 buổi tối online MIỄN PHÍ, 20h00
- Đã có 500+ người đăng ký
- Link đăng ký: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien/?utm_source=dang&utm_term=ktdt&utm_content=fpmongcoaching
- Hotline: 0355 067 656

NỘI DUNG 4 BUỔI:
Buổi 1: Thức tỉnh năng lượng tiền & Luật Hấp Dẫn - hiểu bản chất năng lượng tiền, dòng chảy Đến-Giữ-Tăng trưởng
Buổi 2: Giải phóng tắc nghẽn dòng tiền - gỡ ám thị tài chính, chữa lành tổn thương quá khứ với tiền
Buổi 3: Kích hoạt dòng tiền bằng mục tiêu truyền cảm hứng - đặt mục tiêu chuẩn năng lượng
Buổi 4: Thiết lập kế hoạch - kiểm soát hành động để đạt mục tiêu tài chính bền vững

KHÓA HỌC PHÙ HỢP VỚI:
- Người đang bế tắc tài chính, thu nhập bấp bênh
- Người kinh doanh bán hàng không ra đơn, năng lượng tụt
- Chủ doanh nghiệp chịu áp lực tài chính

VẤN ĐỀ KHÁCH HAY GẶP (dùng để đồng cảm):
1. Nỗ lực kiếm tiền mãi không thấy kết quả, càng làm càng bế tắc
2. Muốn thay đổi tài chính nhưng không biết bắt đầu từ đâu
3. Áp lực tiền bạc khiến năng lượng tụt, kinh doanh bế tắc
4. Cuộc sống rối loạn: công việc, gia đình đều đi xuống
5. Nợ tăng mỗi ngày, làm mãi không đủ trả

VỀ THẦY MONG:
Hơn chục năm trước bị lừa mất hết tiền, vướng nợ, thất nghiệp. Thay đổi nhờ hiểu đúng Luật Hấp Dẫn và Nhân Quả. Nay có tài chính vững vàng và sứ mệnh chia sẻ lại cho mọi người.

KỊCH BẢN TƯ VẤN:
1. Khách hỏi đăng ký → gửi link ngay: https://luathapdan.vn/dao-tao/khoi-thong-dong-tien/?utm_source=dang&utm_term=ktdt&utm_content=fpmongcoaching
2. Khách chia sẻ vấn đề tài chính → lắng nghe, đồng cảm, kết nối vấn đề của họ với nội dung khóa học
3. Khách hỏi chi tiết không biết → "Để mình kết nối bạn với Thầy Mong trực tiếp nhé! Hotline: 0355 067 656"
4. Khách phân vân → nhắc khóa học MIỄN PHÍ, chỉ 4 buổi tối, 500+ người đã đăng ký`;

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
